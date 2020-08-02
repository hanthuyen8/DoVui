// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { PlayerInfo } from "../Data/Data";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerInfoDisplay extends cc.Component
{
    @property(cc.Sprite)
    private sprAvatar: cc.Sprite = null;

    @property(cc.Label)
    private lblNickName: cc.Label = null;

    @property(cc.Label)
    private lblLevel: cc.Label = null;

    public init(info : PlayerInfo): void
    {
        this.lblNickName.string = info.nickName;
    }

}
