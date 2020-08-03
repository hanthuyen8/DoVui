import * as GameSettings from "../GameSettings";
import { RoomInfo, PlayerInfo, Question } from "../Data/Data";
import PhotonClient from "./PhotonClient";
import PlayFabClient from "./PlayFabClient";

export interface INetworkClient
{
    getRooms(): RoomInfo[];
    forceUpdateRoomInfo(): void;

    createRoom(maxPlayers: number, onCreateSuccess: (roomName: string) => void): void;
    joinRoom(roomName: string, onRoomUpdated: Function): void;
    closeRoom(): void;
    //exitRoom(): void;
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
    //#endregion

    public get NickName(): string { return this.nickName; }

    private photon: INetworkClient = null;
    private playFab: PlayFabClient = null;
    private nickName: string = null;

    public connect(userName: string, nickName: string, onSuccess: Function, onError: (msg: string) => void): void
    {
        this.nickName = nickName;
        this.playFab = new PlayFabClient(userName);

        const onPlayFabLoginResult = (authToken: string) =>
        {
            this.photon = new PhotonClient(this.nickName, authToken, onSuccess, onError);
        };

        this.playFab.login(onPlayFabLoginResult, onError);
    }

    public getRooms(): RoomInfo[]
    {
        return this.photon.getRooms();
    }

    public forceUpdateRoomInfo(): void
    {
        this.photon.forceUpdateRoomInfo();
    }

    public joinRoom(roomName: string, onRoomUpdated: (players: PlayerInfo[]) => void): void
    {
        this.photon.joinRoom(roomName, onRoomUpdated);
    }

    public createRoom_AutoClampPlayersNumber(maxPlayers: number, onCreateSuccess: (roomName: string) => void): void
    {
        this.photon.createRoom(cc.misc.clampf(maxPlayers, GameSettings.MIN_PLAYER_COUNT, GameSettings.MAX_PLAYER_COUNT), onCreateSuccess);
    }
}