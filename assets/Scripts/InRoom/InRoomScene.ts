// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import PlayerInfoDisplay from "./PlayerInfoDisplay";
import NetworkController, { NetworkEvent, MessageCode } from "../Network/NetworkController";
import { PlayerInfo, RoomInfo } from "../Data/Data";
import MultiLanguageLabel from "../MultiLanguageLabel";
import LobbyScene from "../Lobby/LobbyScene";
import Chat, { TextAnchor } from "./Chat";

const { ccclass, property } = cc._decorator;

@ccclass
export default class InRoomScene extends cc.Component
{
    private static joinedRoom: RoomInfo = null;
    public static goToRoom(roomInfo: RoomInfo): void
    {
        InRoomScene.joinedRoom = roomInfo;
        cc.director.loadScene("InRoom");
    }

    @property(cc.Prefab)
    private playerInfoDisplayPrefab: cc.Prefab = null;

    @property(cc.Layout)
    private playersContainer: cc.Layout = null;

    @property(cc.Button)
    private btnReady: cc.Button = null;
    private lblReady: MultiLanguageLabel = null;

    @property(cc.Button)
    private btnLeave: cc.Button = null;

    @property(Chat)
    private chatWindow: Chat = null;

    @property private stringId_Ready: string = "inRoom_ready";
    @property private stringId_Start: string = "inRoom_start";
    @property private stringId_Remove: string = "inRoom_remove";
    @property private stringId_Cancel: string = "inRoom_cancel";

    private roomInfo: RoomInfo = null;
    private isRoomMaster: boolean = false;
    private isReady: boolean = false;
    private totalNumberOfReady: number = 0;

    private players: Map<number, PlayerInfoDisplay> = new Map();
    private myUserId: number = 0;

    onLoad()
    {
        cc.systemEvent.on(NetworkEvent.ROOM_ADD_PLAYER, this.onNewPlayerJoined, this);
        cc.systemEvent.on(NetworkEvent.ROOM_REMOVE_PLAYER, this.onNewPlayerRemoved, this);
        cc.systemEvent.on(NetworkEvent.ROOM_MESSAGE, this.onReceiveMessage, this);

        this.roomInfo = InRoomScene.joinedRoom;
        if (!this.roomInfo)
            return;

        const network = NetworkController.getClient();
        this.myUserId = network.getMyUserIdInRoom();
        const players = network.getPlayersInRoom();

        // Add Players
        players.sort((a, b) => a.inRoomUserId - b.inRoomUserId);
        players.forEach(x => this.addPlayer(x));
        const myName = NetworkController.getInstance().DisplayName;
        if (this.roomInfo.masterDisplayName === myName)
        {
            this.isRoomMaster = true;
            this.btnReady.interactable = false;
            this.isReady = true;
            this.totalNumberOfReady = 1;
            this.players.get(this.myUserId).setReady(true);
        }
        this.lblReady = this.btnReady.getComponentInChildren(MultiLanguageLabel);
        this.chatWindow.init((text: string) => this.sendMessage(new MessageChat(text)));
    }

    start()
    {
        if (this.isRoomMaster)
        {
            this.lblReady.changeString(this.stringId_Start);
            this.btnLeave.getComponentInChildren(MultiLanguageLabel).changeString(this.stringId_Remove);
        }
    }

    onDestroy()
    {
        cc.systemEvent.off(NetworkEvent.ROOM_ADD_PLAYER, this.onNewPlayerJoined, this);
        cc.systemEvent.off(NetworkEvent.ROOM_REMOVE_PLAYER, this.onNewPlayerRemoved, this);
        cc.systemEvent.off(NetworkEvent.ROOM_MESSAGE, this.onReceiveMessage, this);
    }

    private sendMessage(message: IMessage, toPlayers?: number[])
    {
        NetworkController.getClient().sendMessage(MessageCode.ROOM_MESSAGE, message, toPlayers);
    }

    private addPlayer(player: PlayerInfo)
    {
        if (CC_DEBUG && this.players.has(player.inRoomUserId))
        {
            cc.error("Có tồn tại 2 player có cùng InRoomUserId");
            cc.log(this.players);
            cc.log(player);
        }

        let node = cc.instantiate(this.playerInfoDisplayPrefab);
        this.playersContainer.node.addChild(node);

        let infoDisplay = node.getComponent(PlayerInfoDisplay);
        infoDisplay.init(player);
        this.players.set(player.inRoomUserId, infoDisplay);
    }

    private removePlayer(player: PlayerInfo)
    {
        let infoDisplay = this.players.get(player.inRoomUserId);
        if (infoDisplay)
        {
            this.players.delete(player.inRoomUserId);
            this.playersContainer.node.removeChild(infoDisplay.node);
            infoDisplay.node.destroy();
        }
    }

    //#region Click Events
    private ready()
    {
        if (this.isRoomMaster)
        {

        }
        else
        {
            const isReady = !this.isReady;
            this.isReady = isReady;

            if (isReady)
            {
                this.btnReady.node.color = cc.Color.BLACK;
                this.lblReady.changeString(this.stringId_Cancel);
                this.btnLeave.interactable = false;
                this.totalNumberOfReady++;
            }
            else
            {
                this.btnReady.node.color = cc.Color.WHITE;
                this.lblReady.changeString(this.stringId_Ready);
                this.btnLeave.interactable = true;
                this.totalNumberOfReady--;
            }

            this.players.get(this.myUserId).setReady(isReady);
            this.sendMessage(new MessageReady(isReady));
        }
    }

    private leaveRoom()
    {
        if (this.isRoomMaster)
        {
            this.sendMessage(new MessageRemoveThisRoom());
        }
        NetworkController.getClient().leaveRoom();
        LobbyScene.GoToLobby();
    }
    //#endregion

    //#region Network Events

    private onReceiveMessage(rawData: IMessage, sender: PlayerInfo)
    {
        if (sender.inRoomUserId == this.myUserId)
            return;

        if (!rawData && !rawData.type)
            return;

        switch (rawData.type)
        {
            case MessageType.Ready:
                {
                    let data = rawData as IMessageReady;
                    let player = this.players.get(sender.inRoomUserId);
                    if (player)
                    {
                        player.setReady(data.isReady);
                        if (this.isRoomMaster)
                        {
                            this.totalNumberOfReady += data.isReady ? 1 : -1;
                            this.btnReady.interactable = this.totalNumberOfReady === this.roomInfo.maxPlayers;
                        }
                    }
                }
                break;

            case MessageType.RemoveThisRoom:
                if (sender.isRoomMaster)
                    this.leaveRoom();
                break;

            case MessageType.Chat:
                {
                    let data = rawData as IMessageChat;
                    this.chatWindow.addMessage(TextAnchor.Left, data.chatMessage, sender.displayName);
                }
                break;
        }
    }

    private onNewPlayerJoined(playerAdded: PlayerInfo)
    {
        this.addPlayer(playerAdded);

        // Gửi ready message thêm một lần nữa để player mới đều thấy được
        NetworkController.getClient().sendMessage(MessageCode.ROOM_MESSAGE, new MessageReady(this.isReady), [playerAdded.inRoomUserId]);
    }

    private onNewPlayerRemoved(playerRemoved: PlayerInfo)
    {
        this.removePlayer(playerRemoved);
    }

    //#endregion

    //#region Cheat Engine
    private cheat_count = 100;
    private cheat_createNewPlayer(name: string)
    {
        if (!CC_DEBUG)
            return;

        let player = new PlayerInfo();
        player.displayName = name;
        player.isRoomMaster = false;
        player.inRoomUserId = this.cheat_count++;

        this.addPlayer(player);
    }

    private cheat_removePlayerWithId(userId: number)
    {
        if (!CC_DEBUG)
            return;

        let infoDisplay = this.players.get(userId);
        if (infoDisplay)
        {
            let player = new PlayerInfo();
            player.inRoomUserId = infoDisplay.InRoomUserId;
            this.removePlayer(player);
        }
    }
    //#endregion
}

interface IMessageReady
{
    type: MessageType;
    isReady: boolean;
}

interface IMessageRemoveThisRoom
{
    type: MessageType;
}

interface IMessageChat
{
    type: MessageType;
    chatMessage: string;
}

type IMessage = IMessageReady | IMessageRemoveThisRoom;

class MessageReady implements IMessageReady
{
    public type = MessageType.Ready;
    public isReady = false;
    constructor(isReady: boolean) { this.isReady = isReady; }
}
class MessageRemoveThisRoom implements IMessageRemoveThisRoom
{
    public type = MessageType.RemoveThisRoom;
}
class MessageChat implements IMessageChat
{
    public type = MessageType.Chat;
    public chatMessage: string = null;
    constructor(chatMessage: string) { this.chatMessage = chatMessage; }
}

enum MessageType { Ready, RemoveThisRoom, Chat };
