const PLAYFAB_TITLE_ID = "FA963";
const PHOTON_APP_ID = "8abf5256-456b-4a24-88ee-0b1f56f6f557";

class Question
{
    question: string = null;
    options: string[] = [];
    answer: number = 0;
}

interface INetworkClient
{
    createRoom(maxPlayers: number): void;
    joinRoom(name?: string): void;
    closeRoom(): void;
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

    private photon: INetworkClient = null;
    private playFab: PlayFabClient = null;
    private nickName: string = null;
    public get NickName(): string { return this.nickName; }

    public connect(userName: string, nickName: string, onSuccess: Function, onError: (msg: string) => void): void
    {
        this.nickName = nickName;
        this.playFab = new PlayFabClient(userName);

        const onPlayFabLoginResult = (authToken: string) =>
        {
            this.photon = new PhotonClient(authToken, onSuccess, onError);
        };

        this.playFab.login(onPlayFabLoginResult, onError);
    }

    private onConnected(): void
    {
        this.createAndJoinNewRoomIfNotExist();
    }

    public createRoom(maxPlayers: number)
    {
        this.photon.createRoom(cc.clamp(maxPlayers, 2, 4));
        this.photon.joinRoom()
    }

    private createAndJoinNewRoomIfNotExist(): void
    {
        this.photon.createRoom();
        this.photon.joinRoom();
        this.playFab.getGameData();
    }

    private startGame(): void
    {
        this.photon.closeRoom();
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

    constructor(auth: string, onSuccess: Function, onError: Function)
    {
        this.client = new Photon.LoadBalancing.LoadBalancingClient(Photon.ConnectionProtocol.Ws, PHOTON_APP_ID, "1.0");
        this.onConnectionSuccess = onSuccess;
        this.onConnectionError = onError;
        this.logger = new Exitgames.Common.Logger("Demo:");

        this.client.onError = this.onError.bind(this);
        this.client.onStateChange = this.onStateChange.bind(this);
        this.client.onRoomListUpdate = this.onRoomListUpdate.bind(this);

            this.client.setCustomAuthentication(auth, Photon.LoadBalancing.Constants.CustomAuthenticationType.Custom);
        this.client.connectToRegionMaster("asia");
    }

    public setNickName(nickName: string)
    {
        this.nickName = nickName;
    }

    public createRoom(players: number = 4): void
    {
        if (this.client.isInLobby)
            this.client.createRoom(this.client.getUserId(), { maxPlayers: players, emptyRoomLiveTime: 1 });
    }

    public joinRoom(roomName: string = null): boolean
    {
        if (this.client.isJoinedToRoom)
            return false;

        if (roomName)
        {
            const rooms = this.client.availableRooms();
            const room = rooms.find(x => x.name == roomName);
            if (room && room.isOpen && room.playerCount < room.maxPlayers)
            {
                this.joinRoom(room.name);
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
                this.logger.info("Welcome " + this.client.myActor().actorNr);
                this.client.myActor().setName(this.nickName);
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

    }

    //#endregion
}
