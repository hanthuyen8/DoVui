// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Languages from "../Languages";
import MultiLanguageLabel from "../MultiLanguageLabel";
import { RoomInfo } from "../Data/Data";
import InRoomScene from "../InRoom/InRoomScene";
import NetworkController, { NetworkEvent } from "../Network/NetworkController";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RoomInfoDisplay extends cc.Component
{
    @property(cc.Sprite)
    private masterAvatar: cc.Sprite = null;

    @property(cc.Label)
    private masterDisplayName: cc.Label = null;

    @property(cc.Label)
    private playerCount: cc.Label = null;

    @property(cc.Label)
    private gameType: cc.Label = null;

    private roomName: string = null;

    onDestroy()
    {
        this.node.off(cc.Node.EventType.TOUCH_END, this.joinRoom, this);
        cc.systemEvent.off(NetworkEvent.LOBBY_JOINED_ROOM, this.joinedRoom, this);
    }

    public init(roomInfo: RoomInfo)
    {
        const playerCountMultiLang = this.playerCount.getComponent(MultiLanguageLabel);
        playerCountMultiLang.refresh();
        this.playerCount.string = `${roomInfo.playerCount}/${roomInfo.maxPlayers} ${playerCountMultiLang.StringTranslated}`;
        this.masterDisplayName.string = roomInfo.masterDisplayName;

        this.roomName = roomInfo.roomName;

        this.node.on(cc.Node.EventType.TOUCH_END, this.joinRoom, this);
    }

    private joinRoom()
    {
        if (!this.roomName)
            return;

        cc.systemEvent.once(NetworkEvent.LOBBY_JOINED_ROOM, this.joinedRoom, this);
        NetworkController.getClient().joinRoom(this.roomName);
    }

    private joinedRoom(roomInfo: RoomInfo)
    {
        InRoomScene.goToRoom(roomInfo);
    }
}
