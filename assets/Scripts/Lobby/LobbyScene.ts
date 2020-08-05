// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import RoomInfoDisplay from "./RoomInfoDisplay";
import Languages from "../Languages";
import NetworkController, { NetworkEvent } from "../Network/NetworkController";
import { RoomInfo } from "../Data/Data";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyScene extends cc.Component
{
    public static GoToLobby(): void
    {
        cc.director.loadScene("Lobby");
    }

    @property(cc.Prefab)
    private roomInfoPrefab: cc.Prefab = null;

    @property(cc.Label)
    private lblWelcome: cc.Label = null;

    @property(cc.ScrollView)
    private listGames: cc.ScrollView = null;

    private roomsInfo: RoomInfo[] = [];
    private currentFilter: number = 0;

    onLoad()
    {
        Languages.Instance.setDefaultLanguage("vi");

        this.lblWelcome.string = NetworkController.getInstance().DisplayName;
        this.updateRoomList();
    }

    private updateRoomList()
    {
        this.roomsInfo = NetworkController.getClient().getRooms();
        this.filterRooms(null, this.currentFilter);
    }

    private filterRooms(event: cc.Event.EventTouch, maxPlayers: number)
    {
        if (this.roomsInfo.length == 0)
            return;

        switch (+maxPlayers)
        {
            case 2:
                this.renderRoomInfo(this.roomsInfo.filter(x => x.maxPlayers === 2));
                this.currentFilter = 2;
                break;
            case 3:
                this.renderRoomInfo(this.roomsInfo.filter(x => x.maxPlayers === 3));
                this.currentFilter = 3;
                break;
            case 4:
                this.renderRoomInfo(this.roomsInfo.filter(x => x.maxPlayers === 4));
                this.currentFilter = 4;
                break;
            default:
                this.renderRoomInfo(this.roomsInfo);
                this.currentFilter = 0;
                break;
        }
    }

    private renderRoomInfo(roomInfo: RoomInfo[])
    {
        this.listGames.content.removeAllChildren();
        for (const info of roomInfo)
        {
            let node = cc.instantiate(this.roomInfoPrefab);
            node.getComponent(RoomInfoDisplay).init(info);

            this.listGames.content.addChild(node);
        }

        this.listGames.scrollToTop();
    }
}
