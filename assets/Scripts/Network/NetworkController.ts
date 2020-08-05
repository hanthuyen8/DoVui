import * as GameSettings from "../GameSettings";
import { RoomInfo, PlayerInfo, Question } from "../Data/Data";
import PhotonClient from "./PhotonClient";
import PlayFabClient from "./PlayFabClient";

export class NetworkEvent
{
    /** Return: RoomInfo[]  */
    public static readonly LOBBY_ADD_ROOM = "LOBBY_ADD_ROOM";

    /** Return: string[] Tên của các Room đã bị removed */
    public static readonly LOBBY_REMOVE_ROOM = "LOBBY_REMOVE_ROOM";

    /** Return: RoomInfo Info của Room đã join thành công */
    public static readonly LOBBY_JOINED_ROOM = "LOBBY_JOINED_ROOM";

    /** Return: any(data), PlayerInfo(sender) */
    public static readonly ROOM_MESSAGE = "ROOM_MESSAGE";

    /** Return: PlayerInfo[] */
    public static readonly ROOM_ADD_PLAYER = "ROOM_ADD_PLAYER";

    /** Return: PlayerInfo[] */
    public static readonly ROOM_REMOVE_PLAYER = "ROOM_REMOVE_PLAYER";

    /** Return: nothing */
    public static readonly ROOM_REMOVED = "ROOM_REMOVED";

    /** Return: any(data), PlayerInfo(sender) */
    public static readonly GAME_MESSAGE = "GAME_MESSAGE";

}
export enum MessageCode { ROOM_MESSAGE, GAME_MESSAGE };

export interface INetworkClient
{
    getRooms(): RoomInfo[];
    getPlayersInRoom(): PlayerInfo[];
    getMyUserIdInRoom(): number;

    createRoom(maxPlayers: number): void;
    joinRoom(roomName: string): void;
    closeRoom(): void;
    leaveRoom(): void;
    sendMessage(eventCode: MessageCode, data: any): void;
}

export default class NetworkController
{
    //#region Static
    private static instance: NetworkController = null;
    public static getInstance(): NetworkController
    {
        if (!NetworkController.instance)
        {
            NetworkController.instance = new NetworkController();
        }

        return NetworkController.instance;
    }
    public static getClient(): INetworkClient { return NetworkController.instance.photon; }

    //#endregion

    public get DisplayName(): string { return this.displayName; }

    private photon: INetworkClient = null;
    private playFab: PlayFabClient = null;
    private displayName: string = null;

    public connect(userName: string, nickName: string, onSuccess: Function, onError: (msg: string) => void): void
    {
        this.displayName = nickName;
        this.playFab = new PlayFabClient(userName, nickName);

        const onPlayFabLoginResult = (authToken: string) =>
        {
            this.photon = new PhotonClient(this.displayName, authToken, onSuccess, onError);
        };

        this.playFab.login(onPlayFabLoginResult, onError);
    }
}