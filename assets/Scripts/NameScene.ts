// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import * as GameSettings from "./GameSettings"
import NetworkController from "./Network/NetworkController";
import LobbyScene from "./Lobby/LobbyScene";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NameScene extends cc.Component
{
    @property
    private useCache: boolean = true;

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

        if (storedNickName && storedUserName && Guid.isValid(storedUserName))
        {
            this.nameEdit.string = storedNickName;
            if (this.useCache)
                this.connect(storedUserName, storedNickName);
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
        this.connect(Guid.newGuid().toString(), nickName);
    }

    private connect(userName: string, nickName: string)
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
            LobbyScene.GoToLobby();
        };
        NetworkController.getInstance().connect(userName, nickName, onConnectSuccess, onConnectError);
    }
}

function sanitizeString(str: string): string
{
    return str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "").trim();
}

class Guid
{
    public static newGuid(): Guid
    {
        return new Guid('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c =>
        {
            const r = Math.random() * 16 | 0;
            const v = (c == 'x') ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }));
    }
    public static get empty(): string
    {
        return '00000000-0000-0000-0000-000000000000';
    }
    public get empty(): string
    {
        return Guid.empty;
    }
    public static isValid(str: string): boolean
    {
        const validRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return validRegex.test(str);
    }
    private value: string = this.empty;
    private constructor(value?: string)
    {
        if (value)
        {
            if (Guid.isValid(value))
            {
                this.value = value;
            }
        }
    }
    public toString()
    {
        return this.value;
    }

    public toJSON(): string
    {
        return this.value;
    }
}
