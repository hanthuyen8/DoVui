import * as GameSettings from "../GameSettings";

export class PlayerInfo
{
    public inRoomUserId: number = null;
    public displayName: string = null;
    public isRoomMaster: boolean = false;
    public level: number = 0;
    public exp: number = 0;
}

export class Question
{
    public question: string = null;
    public options: string[] = [];
    public answer: number = 0;
}

export class RoomInfo
{
    public roomName: string = null;
    public maxPlayers: number = GameSettings.MAX_PLAYER_COUNT;
    public playerCount: number = 1;
    public masterDisplayName: string = null;
}

interface Callback_1<T1, T2 = void>
{
    (param1: T1): T2;
}