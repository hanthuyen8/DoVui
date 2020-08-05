// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { PlayerInfo } from "../Data/Data";
import MultiLanguageLabel from "../MultiLanguageLabel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerInfoDisplay extends cc.Component
{
    @property(cc.Sprite)
    private sprAvatar: cc.Sprite = null;

    @property(cc.Label)
    private lblDisplayName: cc.Label = null;

    @property(cc.Label)
    private lblLevel: cc.Label = null;

    public get InRoomUserId(): number { return this.inRoomUserId; }
    private inRoomUserId: number = 0;

    public init(info: PlayerInfo): void
    {
        this.inRoomUserId = info.inRoomUserId;
        this.lblDisplayName.string = info.displayName;

        const levelMultiLang = this.lblLevel.getComponent(MultiLanguageLabel);
        levelMultiLang.refresh();
        this.lblLevel.string = `${levelMultiLang.LanguageTranslated} ${info.level}`;

        if (CC_DEBUG)
        {
            this.lblLevel.string = "UserId: " + info.inRoomUserId;
        }
    }

    public setReady(isReady: boolean)
    {
        this.node.color = isReady ? cc.Color.GREEN : cc.Color.WHITE;
    }

}
