// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import * as GameSettings from "../GameSettings"
import NetworkController from "../Network/NetworkController";
import InRoomScene from "../InRoom/InRoomScene";
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
        NetworkController.getInstance().createRoom_AutoClampPlayersNumber(this.maxPlayers, (roomName) => { InRoomScene.JoinThisRoom(roomName); });
    }
}
