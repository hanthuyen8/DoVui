export default class Languages
{
    public static get Instance(): Languages
    {
        return this.instance;
    }
    private static instance: Languages = new Languages();

    private langs: Language[] = [];
    private defaultLang: Language = null;

    private constructor()
    {
        const filePath = "languages";
        cc.resources.load(filePath, cc.JsonAsset, (jsonLoadError, json: cc.JsonAsset) =>
        {
            if (json)
            {
                this.langs = json.json as Language[];
                this.defaultLang = this.langs[0];
                cc.resources.release(filePath);
            }
            else
            {
                cc.error(jsonLoadError);
            }
        });
    }

    public setDefaultLanguage(langId: string)
    {
        let newLang = this.langs.find(x => x.language == langId);
        if (newLang)
        {
            this.defaultLang = newLang;
        }
    }

    public getLangId(): string { return this.defaultLang.language; }

    public translate(string_id: string): string
    {
        const data = this.defaultLang.data;
        if (string_id in data)
            return data[string_id];

        cc.error("Missing Lang String_Id: " + string_id);
        return `?missing ${string_id}`;
    }
}

class Language
{
    public language: string = null;
    public data: any = null;
}