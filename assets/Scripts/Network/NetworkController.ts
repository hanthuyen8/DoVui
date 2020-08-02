import * as GameSettings from "../GameSettings";
import { RoomInfo, PlayerInfo, Question } from "../Data/Data";

const PLAYFAB_TITLE_ID = "FA963";
const PHOTON_APP_ID = "8abf5256-456b-4a24-88ee-0b1f56f6f557";

interface INetworkClient
{
    setNickName(nickName: string): void;
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
            this.photon = new PhotonClient(authToken, onSuccess, onError);
            this.photon.setNickName(this.nickName);
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

class PlayFabClient
{
    private playFabId: string = null;
    private playFabUserName: string = null;

    public get PlayFabId(): string { return this.playFabId; }
    public get PlayFabUserName(): string { return this.playFabUserName; }
    private getPhotonAuthTokenFormat(token: string) { return `username=${this.playFabId}&token=${token}`; }

    public constructor(playFabUserName: string)
    {
        this.playFabUserName = playFabUserName;
        PlayFab.settings.titleId = PLAYFAB_TITLE_ID;
    }

    public login(onSuccess: (authToken: string) => void, onError: (msg: string) => void): void
    {
        const loginRequest = {
            CustomId: this.playFabUserName,
            CreateAccount: true
        } as PlayFabClientModels.LoginWithCustomIDRequest;

        const loginResult = (result: PlayFabModule.SuccessContainer<PlayFabClientModels.LoginResult>, error: PlayFabModule.IPlayFabError) =>
        {
            if (result && result.data)
            {
                this.playFabId = result.data.PlayFabId;
                this.getAuthTokenForPhoton(onSuccess, onError);
            }
            else
            {
                onError(error.error);
            }
        };

        PlayFabClientSDK.LoginWithCustomID(loginRequest, loginResult);
    }

    public getGameData(): Question[]
    {
        let request = {
            Keys: ["MathQuestions"]
        } as PlayFabClientModels.GetTitleDataRequest;

        let questions: Question[] = [];

        PlayFabClientSDK.GetTitleData(request, function (result, error)
        {
            if (result && result.data)
                questions = JSON.parse(result.data.Data[request.Keys[0]]) as Question[];
            if (error)
                console.log(error);
        });

        return questions;
    }

    private getAuthTokenForPhoton(onSuccess: (authToken: string) => void, onError: (msg: string) => void): void
    {
        const photonRequest = {
            PhotonApplicationId: PHOTON_APP_ID
        } as PlayFabClientModels.GetPhotonAuthenticationTokenRequest;

        const getAuthResult = (result: PlayFabModule.SuccessContainer<PlayFabClientModels.GetPhotonAuthenticationTokenResult>, error: PlayFabModule.IPlayFabError) =>
        {
            if (result && result.data)
            {
                const token = this.getPhotonAuthTokenFormat(result.data.PhotonCustomAuthenticationToken);
                onSuccess(token);
            }
            if (error)
            {
                onError(error.error);
            }
        };

        PlayFabClientSDK.GetPhotonAuthenticationToken(photonRequest, getAuthResult);
    }
}

class PhotonClient implements INetworkClient
{
    private logger: Exitgames.Common.Logger;
    private client: Photon.LoadBalancing.LoadBalancingClient;
    private nickName: string = null;
    private onConnectionSuccess: Function = null;
    private onConnectionError: Function = null;
    private onCreateRoomSuccess: (roomName: string) => void = null;
    private onRoomUpdated: (players: PlayerInfo[]) => void = null;

    constructor(auth: string, onSuccess: Function, onError: Function)
    {
        this.client = new Photon.LoadBalancing.LoadBalancingClient(Photon.ConnectionProtocol.Ws, PHOTON_APP_ID, "1.0");
        this.onConnectionSuccess = onSuccess;
        this.onConnectionError = onError;
        this.logger = new Exitgames.Common.Logger("Demo:");

        this.client.onError = this.onError.bind(this);
        this.client.onStateChange = this.onStateChange.bind(this);
        this.client.onRoomListUpdate = this.onRoomListUpdate.bind(this);
        this.client.onActorJoin = this.updateRoom.bind(this);
        this.client.onActorLeave = this.updateRoom.bind(this);

        this.client.setCustomAuthentication(auth, Photon.LoadBalancing.Constants.CustomAuthenticationType.Custom);
        this.client.connectToRegionMaster("asia");
    }

    public setNickName(nickName: string)
    {
        this.nickName = nickName;
    }

    public getRooms(): RoomInfo[]
    {
        if (!this.client.isInLobby)
            return;

        let roomInfo: RoomInfo[] = [];
        for (const room of this.client.availableRooms())
        {
            let info = new RoomInfo();
            info.playerCount = room.playerCount;
            info.roomName = room.name;
            info.maxPlayers = room.maxPlayers;
            info.masterPlayerNickName = room.name.split("_")[0];
            roomInfo.push(info);
        }
        return roomInfo;
    }

    public forceUpdateRoomInfo(): void
    {
        if (!this.client.isJoinedToRoom)
            return;

        this.updateRoom();
    }

    public createRoom(players: number = 4, onCreateSuccess: (roomName: string) => void): void
    {
        if (!this.client.isInLobby)
            return;

        this.onCreateRoomSuccess = onCreateSuccess;
        const roomName = `${this.nickName}_${this.client.getUserId()}`;
        this.client.createRoom(roomName, { maxPlayers: players, emptyRoomLiveTime: 1 });
    }

    public joinRoom(roomName: string = null, onRoomUpdated: (players: PlayerInfo[]) => void): boolean
    {
        if (this.client.isJoinedToRoom)
        {
            if (this.client.myRoom().name == roomName)
            {
                this.onRoomUpdated = onRoomUpdated;
                return true;
            }
            return false;
        }

        if (roomName)
        {
            this.onRoomUpdated = onRoomUpdated;
            const rooms = this.client.availableRooms();
            const room = rooms.find(x => x.name == roomName);
            if (room && room.isOpen && room.playerCount < room.maxPlayers)
            {
                this.client.joinRoom(room.name);
                return true;
            }
            return false;
        }
        return this.client.joinRandomRoom();
    }

    public closeRoom(): void
    {
        this.client.myRoom().setIsOpen(false);
    }

    //#region Internal Functions

    private onError(errorCode: number, errorMsg: string): void
    {
        this.logger.error(errorMsg);
        if (this.onConnectionError)
            this.onConnectionError();
        this.onConnectionError = null;
    }

    private onStateChange(state: number): void
    {
        switch (state)
        {
            case Photon.LoadBalancing.LoadBalancingClient.State.JoinedLobby:
                this.logger.info("Welcome " + this.client.getUserId());
                if (this.onConnectionSuccess)
                    this.onConnectionSuccess();
                this.onConnectionSuccess = null;
                break;

            case Photon.LoadBalancing.LoadBalancingClient.State.Joined:
                const actor = this.client.myActor();
                this.logger.info("Welcome " + actor.actorNr);
                actor.setName(this.nickName);

                if (this.client.myRoomMasterActorNr() == actor.actorNr && this.onCreateRoomSuccess)
                    this.onCreateRoomSuccess(this.client.myRoom().name);

                break;

            default:
                break;
        }
    }

    private onRoomListUpdate(
        rooms: Photon.LoadBalancing.RoomInfo[],
        roomsUpdated: Photon.LoadBalancing.RoomInfo[],
        roomsAdded: Photon.LoadBalancing.RoomInfo[],
        roomsRemoved: Photon.LoadBalancing.RoomInfo[]): void
    {
        if (roomsAdded.length > 0)
        {
            // Tự động join vào room mà mình đã khởi tạo
            const userId = this.client.getUserId();
            const room = roomsAdded.find(x => x.name == userId)
            if (room && this.onCreateRoomSuccess)
            {
                //this.onCreateRoomSuccess(room.name);
            }
        }
    }

    private updateRoom(): void
    {
        if (!this.onRoomUpdated)
            return;

        let players: PlayerInfo[] = [];
        for (const actor of this.client.myRoomActorsArray() as Photon.LoadBalancing.Actor[])
        {
            let info = new PlayerInfo();
            info.isRoomMaster = actor.actorNr == 1;
            info.nickName = actor.name;
            info.userId = actor.actorNr;

            players.push(info);
        }
        this.onRoomUpdated(players);
    }

    //#endregion
}
