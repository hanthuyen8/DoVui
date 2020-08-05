// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import * as GameSettings from "../GameSettings";
import PlayerInfoDisplay from "./PlayerInfoDisplay";
import NetworkController, { NetworkEvent, MessageCode } from "../Network/NetworkController";
import { PlayerInfo, RoomInfo } from "../Data/Data";
import MultiLanguageLabel from "../MultiLanguageLabel";
import LobbyScene from "../Lobby/LobbyScene";

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
    private btnStartOrReady: cc.Button = null;

    @property(cc.Button)
    private btnRemoveOrLeave: cc.Button = null;

    private isRoomMaster: boolean = false;
    private isReady: boolean = false;

    private players: Map<number, PlayerInfoDisplay> = new Map();
    private myUserId: number = 0;

    onLoad()
    {
        cc.systemEvent.on(NetworkEvent.ROOM_ADD_PLAYER, this.onNewPlayerJoined, this);
        cc.systemEvent.on(NetworkEvent.ROOM_REMOVE_PLAYER, this.onNewPlayerRemoved, this);
        cc.systemEvent.once(NetworkEvent.ROOM_REMOVED, this.onRoomRemoved, this);
        cc.systemEvent.on(NetworkEvent.ROOM_MESSAGE, this.onReceiveMessage, this);

        const roomInfo = InRoomScene.joinedRoom;
        if (!roomInfo)
            return;

        const network = NetworkController.getClient();
        this.myUserId = network.getMyUserIdInRoom();
        this.updateRoom(network.getPlayersInRoom());

        if (roomInfo.masterDisplayName === NetworkController.getInstance().DisplayName)
        {
            this.isRoomMaster = true;
        }
    }

    start()
    {
        if (this.isRoomMaster)
        {
            this.btnStartOrReady.node.on(cc.Node.EventType.TOUCH_END, this.startGame, this);
            let lblStart = this.btnStartOrReady.getComponentInChildren(MultiLanguageLabel);
            lblStart.split(0);
            lblStart.refresh();

            this.btnRemoveOrLeave.node.on(cc.Node.EventType.TOUCH_END, this.removeRoom, this);
            let lblDelete = this.btnRemoveOrLeave.getComponentInChildren(MultiLanguageLabel);
            lblDelete.split(0);
            lblDelete.refresh();
        }
        else
        {
            this.btnStartOrReady.node.on(cc.Node.EventType.TOUCH_END, this.ready, this);
            let lblReady = this.btnStartOrReady.getComponentInChildren(MultiLanguageLabel);
            lblReady.split(1);
            lblReady.refresh();

            this.btnRemoveOrLeave.node.on(cc.Node.EventType.TOUCH_END, this.leaveRoom, this);
            let lblExit = this.btnRemoveOrLeave.getComponentInChildren(MultiLanguageLabel);
            lblExit.split(1);
            lblExit.refresh();
        }
    }

    onDestroy()
    {
        cc.systemEvent.off(NetworkEvent.ROOM_ADD_PLAYER, this.onNewPlayerJoined, this);
        cc.systemEvent.off(NetworkEvent.ROOM_REMOVE_PLAYER, this.onNewPlayerRemoved, this);
        cc.systemEvent.off(NetworkEvent.ROOM_REMOVED, this.onRoomRemoved, this);
        this.btnStartOrReady.node.off(cc.Node.EventType.TOUCH_END);
        this.btnRemoveOrLeave.node.off(cc.Node.EventType.TOUCH_END);
    }

    private startGame()
    {

    }

    private removeRoom()
    {
        this.leaveRoom();
    }

    private ready()
    {
        this.isReady = !this.isReady;
        this.btnStartOrReady.node.color = this.isReady ? cc.Color.GRAY : cc.Color.WHITE;
        this.players.get(this.myUserId).setReady(this.isReady);
        NetworkController.getClient().sendMessage(MessageCode.ROOM_MESSAGE, new MessageReady(this.isReady));
    }

    private leaveRoom()
    {
        NetworkController.getClient().leaveRoom();
        LobbyScene.GoToLobby();
    }

    private updateRoom(players: PlayerInfo[])
    {
        this.playersContainer.node.removeAllChildren();
        players.sort((a, b) => a.inRoomUserId - b.inRoomUserId);
        players.forEach(x => this.onNewPlayerJoined(x));
    }

    private onReceiveMessage(data: IMessage, sender: PlayerInfo)
    {
        if (sender.inRoomUserId == this.myUserId)
            return;

        if (!data && !data.type)
            return;

        if (data.type === MessageType.Ready)
        {
            let message = data as IMessageReady;
            let player = this.players.get(sender.inRoomUserId);
            if (player)
                player.setReady(message.isReady);
        }
    }

    private onNewPlayerJoined(playerAdded: PlayerInfo)
    {
        if (CC_DEBUG && this.players.has(playerAdded.inRoomUserId))
        {
            cc.error("Có tồn tại 2 player có cùng InRoomUserId");
            cc.log(this.players);
            cc.log(playerAdded);
        }

        let node = cc.instantiate(this.playerInfoDisplayPrefab);
        this.playersContainer.node.addChild(node);

        let infoDisplay = node.getComponent(PlayerInfoDisplay);
        infoDisplay.init(playerAdded);
        this.players.set(playerAdded.inRoomUserId, infoDisplay);
    }

    private onNewPlayerRemoved(playerRemoved: PlayerInfo)
    {
        let infoDisplay = this.players.get(playerRemoved.inRoomUserId);
        if (infoDisplay)
        {
            this.players.delete(playerRemoved.inRoomUserId);
            this.playersContainer.node.removeChild(infoDisplay.node);
            infoDisplay.node.destroy();
        }
    }

    private onRoomRemoved()
    {
        LobbyScene.GoToLobby();
    }

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

        this.onNewPlayerJoined(player);
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
            this.onNewPlayerRemoved(player);
        }
    }
    //#endregion
}

interface IMessageReady
{
    type: MessageType;
    isReady: boolean;
}

interface IMessageOther
{
    type: MessageType;
    something: number;
}

type IMessage = IMessageReady | IMessageOther;

class MessageReady implements IMessageReady
{
    public type = MessageType.Ready;
    public isReady = false;
    constructor(isReady: boolean) { this.isReady = isReady; }
}

enum MessageType { Ready, Other };
