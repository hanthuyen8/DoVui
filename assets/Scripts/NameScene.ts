// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import * as GameSettings from "./GameSettings"
import NetworkController from "./Network/NetworkController";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NameScene extends cc.Component
{
    @property(cc.Label)
    private infoLbl: cc.Label = null;

    @property(cc.EditBox)
    private nameEdit: cc.EditBox = null;

    @property(cc.Button)
    private enterBtn: cc.Button = null;

    onLoad()
    {
        this.infoLbl.string = "";
    }

    start()
    {
        let storedNickName = cc.sys.localStorage.getItem("nickName");
        let storedUserName = cc.sys.localStorage.getItem("userName");

        if (storedNickName && storedUserName)
        {
            this.submit(storedUserName, storedNickName);
        }
    }

    private submitNickName()
    {
        let nickName = this.nameEdit.string;
        if (!nickName || nickName.trim() == "")
        {
            nickName = GameSettings.DEFAULT_PLAYER_NICKNAME;
            this.nameEdit.string = GameSettings.DEFAULT_PLAYER_NICKNAME;
        }
        else
        {
            let newName = sanitizeString(nickName);
            if (newName.length != nickName.length)
            {
                this.nameEdit.string = newName;
                this.infoLbl.string = "A simple name is best";
                return;
            }
            nickName = newName;
        }
        this.submit(GameSettings.DEFAULT_PLAYER_ID, nickName);
    }

    private submit(userName: string, nickName: string)
    {
        this.nameEdit.enabled = false;
        this.infoLbl.string = "Connecting to Mars...";
        this.enterBtn.interactable = false;

        const onConnectError = () =>
        {
            this.infoLbl.string = "Connection Failed!";
            this.enterBtn.interactable = true;
            this.nameEdit.enabled = true;
        };
        const onConnectSuccess = () =>
        {
            this.infoLbl.string = "Connect Successful.";
            cc.sys.localStorage.setItem("userName", userName);
            cc.sys.localStorage.setItem("nickName", nickName);
            cc.director.loadScene("Lobby");
        };
        NetworkController.getInstance().connect(userName, nickName, onConnectSuccess, onConnectError);
    }
}

function sanitizeString(str: string): string
{
    return str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "").trim();
}
