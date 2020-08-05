import InRoomScene from "./InRoom/InRoomScene";

class CheatEngine
{
    private inRoom: InRoomScene;
    public get InRoom()
    {
        if (!this.inRoom || !cc.isValid(this.inRoom))
            this.inRoom = cc.Canvas.instance.getComponentInChildren(InRoomScene);

        return this.inRoom;
    }
}


declare let CheatConsole: CheatEngine;
CheatConsole = new CheatEngine();