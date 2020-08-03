import { INetworkClient } from "./NetworkController";
import { PlayerInfo, RoomInfo } from "../Data/Data";

export const PHOTON_APP_ID = "8abf5256-456b-4a24-88ee-0b1f56f6f557";

export default class PhotonClient implements INetworkClient
{
    private logger: Exitgames.Common.Logger;
    private client: Photon.LoadBalancing.LoadBalancingClient;
    private onConnectionSuccess: Function = null;
    private onConnectionError: Function = null;
    private onCreateRoomSuccess: (roomName: string) => void = null;
    private onRoomUpdated: (players: PlayerInfo[]) => void = null;

    constructor(nickName: string, auth: string, onSuccess: Function, onError: Function)
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
        this.client.myActor().setName(nickName);
        this.client.connectToRegionMaster("asia");
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
            info.masterPlayerNickName = room.name.split("#")[0];
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
        const roomName = `${this.client.myActor().name}#${this.client.getUserId()}`;
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