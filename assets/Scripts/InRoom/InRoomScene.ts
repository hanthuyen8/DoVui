// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import PlayerInfoDisplay from "./PlayerInfoDisplay";
import NetworkController from "../Network/NetworkController";
import { PlayerInfo } from "../Data/Data";

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

    onLoad()
    {
        const roomName = InRoomScene.InRoomName;
        if (!roomName)
            return;

        const network  = NetworkController.getInstance();
        network.joinRoom(roomName, this.updateRoom.bind(this));
        network.forceUpdateRoomInfo();
    }

    private updateRoom(players: PlayerInfo[])
    {
        this.playersContainer.node.removeAllChildren();
        for (const info of players)
        {
            let node = cc.instantiate(this.playerInfoDisplayPrefab);
            this.playersContainer.node.addChild(node);

            let player = node.getComponent(PlayerInfoDisplay);
            player.init(info);
        }
    }
}
