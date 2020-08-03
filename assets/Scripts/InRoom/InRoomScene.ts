// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import PlayerInfoDisplay from "./PlayerInfoDisplay";
import NetworkController from "../Network/NetworkController";
import { PlayerInfo } from "../Data/Data";
import MultiLanguageLabel from "../MultiLanguageLabel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class InRoomScene extends cc.Component
{
    private static InRoomName: string = null;
    public static JoinThisRoom(roomName: string): void
    {
        InRoomScene.InRoomName = roomName;
        cc.director.loadScene("InRoom");
    }

    @property(cc.Prefab)
    private playerInfoDisplayPrefab: cc.Prefab = null;

    @property(cc.Layout)
    private playersContainer: cc.Layout = null;

    @property(cc.Button)
    private btnStartOrReady: cc.Button = null;

    @property(cc.Button)
    private btnDeleteOrExit: cc.Button = null;

    private isRoomMaster: boolean = false;

    onLoad()
    {
        const roomName = InRoomScene.InRoomName;
        if (!roomName)
            return;

        const network = NetworkController.getInstance();
        network.joinRoom(roomName, this.updateRoom.bind(this));
        network.forceUpdateRoomInfo();

        const roomMasterName = roomName.split("#")[0];
        if (roomMasterName && roomMasterName == network.NickName)
        {
            this.isRoomMaster = true;
        }
    }

    start()
    {
        if (this.isRoomMaster)
        {
            let lblStart = this.btnStartOrReady.getComponentInChildren(MultiLanguageLabel);
            lblStart.split(0);
            lblStart.refresh();

            let lblDelete = this.btnDeleteOrExit.getComponentInChildren(MultiLanguageLabel);
            lblDelete.split(0);
            lblDelete.refresh();
        }
        else
        {
            let lblReady = this.btnStartOrReady.getComponentInChildren(MultiLanguageLabel);
            lblReady.split(1);
            lblReady.refresh();

            let lblExit = this.btnDeleteOrExit.getComponentInChildren(MultiLanguageLabel);
            lblExit.split(1);
            lblExit.refresh();
        }
    }

    private updateRoom(players: PlayerInfo[])
    {
        this.playersContainer.node.removeAllChildren();
        players.sort((a, b) => a.userId - b.userId);
        for (const info of players)
        {
            let node = cc.instantiate(this.playerInfoDisplayPrefab);
            this.playersContainer.node.addChild(node);

            let player = node.getComponent(PlayerInfoDisplay);
            player.init(info);
        }
    }
}
