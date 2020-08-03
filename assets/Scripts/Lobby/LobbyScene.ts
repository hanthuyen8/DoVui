// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import RoomInfoDisplay from "./RoomInfoDisplay";
import Languages from "../Languages";
import NetworkController from "../Network/NetworkController";
import CreateRoomDialog from "./CreateRoomDialog";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyScene extends cc.Component
{
    @property(CreateRoomDialog)
    private createRoomDialog: CreateRoomDialog = null;

    @property(cc.Prefab)
    private roomInfoPrefab: cc.Prefab = null;

    @property(cc.Label)
    private lblWelcome: cc.Label = null;

    @property(cc.Label)
    private lblTitle: cc.Label = null;

    @property(cc.Label)
    private lblJoinGames: cc.Label = null;

    @property(cc.Button)
    private btnCreateNewGame: cc.Button = null;

    @property(cc.ScrollView)
    private listGames: cc.ScrollView = null;

    private labels: cc.Label[] = [];

    onLoad()
    {
        Languages.Instance.setDefaultLanguage("vi");
        const lang = Languages.Instance;

        this.lblWelcome.string = NetworkController.getInstance().NickName;
        this.getRooms();
    }

    private getRooms()
    {
        const roomInfo = NetworkController.getInstance().getRooms();
        let roomInfoDisplay = this.roomInfoPrefab.data.getComponent(RoomInfoDisplay);
        if (!roomInfoDisplay)
            return;

        for (const info of roomInfo)
        {
            let node = cc.instantiate(this.roomInfoPrefab);
            node.getComponent(RoomInfoDisplay).init(info);

            this.listGames.content.addChild(node);
        }

        this.listGames.scrollToTop();
    }
}
