// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import * as GameSettings from "../GameSettings"
import NetworkController, { NetworkEvent } from "../Network/NetworkController";
import InRoomScene from "../InRoom/InRoomScene";
import { RoomInfo } from "../Data/Data";
const { ccclass, property } = cc._decorator;

@ccclass
export default class CreateRoomDialog extends cc.Component
{
    @property(cc.Button)
    private btnClose: cc.Button = null;

    @property(cc.Label)
    private lblMaxPlayers: cc.Label = null;

    @property(cc.Button)
    private btn2Players: cc.Button = null;

    @property(cc.Button)
    private btn3Players: cc.Button = null;

    @property(cc.Button)
    private btn4Players: cc.Button = null;

    @property(cc.Button)
    private btnCreate: cc.Button = null;

    private maxPlayers: number = GameSettings.MAX_PLAYER_COUNT;

    onLoad()
    {
        this.closeDialog();
        this.node.setPosition(cc.Vec2.ZERO);
    }

    onDestroy()
    {
        cc.systemEvent.off(NetworkEvent.LOBBY_JOINED_ROOM, this.joinedRoom, this);
    }

    public openDialog(): void
    {
        this.node.active = true;
    }

    public closeDialog(): void
    {
        this.node.active = false;
    }

    private setMaxPlayers(event: any, value: string)
    {
        this.maxPlayers = parseInt(value);
    }

    private createRoom()
    {
        cc.systemEvent.once(NetworkEvent.LOBBY_JOINED_ROOM, this.joinedRoom, this);
        NetworkController.getClient().createRoom( cc.misc.clampf(this.maxPlayers, GameSettings.MIN_PLAYER_COUNT, GameSettings.MAX_PLAYER_COUNT));
    }

    private joinedRoom(roomInfo : RoomInfo)
    {
        InRoomScene.goToRoom(roomInfo);
    }
}
