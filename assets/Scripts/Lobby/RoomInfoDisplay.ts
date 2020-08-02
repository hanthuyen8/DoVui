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

const { ccclass, property } = cc._decorator;

@ccclass
export default class RoomInfoDisplay extends cc.Component
{
    @property(cc.Sprite)
    private masterPlayerAvatar: cc.Sprite = null;

    @property(cc.Label)
    private masterPlayerNickName: cc.Label = null;

    @property(cc.Label)
    private playerCount: cc.Label = null;

    @property(cc.Label)
    private gameType: cc.Label = null;

    private roomName: string = null;

    onDestroy()
    {
        this.node.off(cc.Node.EventType.TOUCH_END, this.joinRoom, this);
    }

    public setInfo(roomInfo: RoomInfo)
    {
        const lang = Languages.Instance;
        const font = lang.getFont();

        this.masterPlayerNickName.font = font;
        this.playerCount.font = font;
        this.gameType.font = font;

        const playerCountMultiLang = this.playerCount.getComponent(MultiLanguageLabel);
        playerCountMultiLang.refresh();
        this.playerCount.string = `${roomInfo.playerCount}/${roomInfo.maxPlayers} ${playerCountMultiLang.LanguageTranslated}`;
        this.masterPlayerNickName.string = roomInfo.masterPlayerNickName;

        this.roomName = roomInfo.roomName;

        this.node.on(cc.Node.EventType.TOUCH_END, this.joinRoom, this);
    }

    private joinRoom()
    {
        if (!this.roomName)
            return;

        InRoomScene.JoinThisRoom(this.roomName);
    }
}
