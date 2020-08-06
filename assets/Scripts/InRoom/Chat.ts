const { ccclass, property } = cc._decorator;

@ccclass
export default class Chat extends cc.Component
{
    @property(cc.ScrollView)
    private scvChatWindow: cc.ScrollView = null;
    @property(cc.EditBox)
    private editBox: cc.EditBox = null;
    @property(cc.Prefab)
    private conversationLeftPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    private conversationRightPrefab: cc.Prefab = null;

    @property(cc.Label)
    private unreadMessage: cc.Label = null;
    private unreadCount: number = 0;

    private onTextSubmit: (text: string) => void = null;
    private latestTitle: string = null;

    onLoad()
    {
        this.hide();
        this.node.setPosition(cc.Vec2.ZERO);
        this.unreadMessage.string = "";
    }

    public init(onTextSubmit: (text: string) => void): void
    {
        this.onTextSubmit = onTextSubmit;
    }

    public show(): void
    {
        this.node.active = true;
        this.unreadMessage.string = "";
        this.unreadCount = 0;
    }

    public hide(): void
    {
        this.node.active = false;
    }

    public addMessage(anchor: TextAnchor, text: string, title?: string): void
    {
        let label: cc.Label;
        switch (anchor)
        {
            case TextAnchor.Left:
                label = cc.instantiate(this.conversationLeftPrefab).getComponent(cc.Label);
                break;
            case TextAnchor.Right:
                label = cc.instantiate(this.conversationRightPrefab).getComponent(cc.Label);
                break;
        }

        if (title && title != this.latestTitle)
        {
            this.latestTitle = title;
            label.string = "\n" + title + ":\n" + text;
        }
        else
        {
            label.string = text;
        }

        this.scvChatWindow.content.addChild(label.node);

        if (!this.node.activeInHierarchy)
        {
            if (++this.unreadCount > 9)
                this.unreadMessage.string = "9+";
            else
                this.unreadMessage.string = this.unreadCount.toString();
        }
    }

    private submitEditBox()
    {
        let text = this.editBox.string;
        if (!text || text.length == 0)
            return;

        this.addMessage(TextAnchor.Right, text);
        this.onTextSubmit(text);
        this.editBox.string = "";
        setTimeout(() => this.editBox.focus(), 100);
    }
}

export enum TextAnchor { Left, Right }