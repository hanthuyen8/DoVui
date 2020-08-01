// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Languages from "./GameSettings";
import NetworkController from "./Network/NetworkController";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LobbyScene extends cc.Component
{
    @property(cc.Label)
    private lblWelcome: cc.Label = null;

    @property(cc.Label)
    private lblTitle: cc.Label = null;

    @property(cc.Label)
    private lblJoinGames: cc.Label = null;

    @property(cc.Label)
    private lblCreateNewGame: cc.Label = null;

    @property(cc.ScrollView)
    private listGames: cc.ScrollView = null;

    private labels: cc.Label[] = [];

    onLoad()
    {
        Languages.Instance.setDefaultLanguage("vi");
        const lang = Languages.Instance.getData();

        this.lblWelcome.string = NetworkController.getInstance().NickName;
        this.lblTitle.string = lang.lobby_title;
        this.lblJoinGames.string = lang.lobby_desc;
        this.lblCreateNewGame.string = lang.lobby_new_game;

        const newFont = Languages.Instance.getFont();
        if (newFont)
        {
            this.labels = cc.Canvas.instance.getComponentsInChildren(cc.Label);
            for (const lbl of this.labels)
            {
                if (lbl.font != newFont)
                    lbl.font = newFont;
            }
        }
    }

    private createRoom(maxPlayer : number = 2)
    {
        
    }
}
