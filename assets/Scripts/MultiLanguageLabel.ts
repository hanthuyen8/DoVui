// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Languages from "./Languages";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MultiLanguageLabel extends cc.Component
{
    public get LanguageDataId(): string { return this.languageDataId; }
    public get LanguageTranslated(): string { return this.languageTranslated; }

    @property
    private languageDataId: string = "";

    private label: cc.Label = null;
    private languageId: string = null;
    private languageTranslated: string = null;

    onLoad()
    {
        this.label = this.getComponent(cc.Label);
        this.refresh();
    }

    public refresh()
    {
        const currentLang = Languages.Instance.getLangId();
        if (this.languageId == currentLang)
            return;

        this.languageId = currentLang;
        this.languageTranslated = Languages.Instance.translate(this.languageDataId);

        if (this.label)
            this.label.string = this.languageTranslated;
    }
}
