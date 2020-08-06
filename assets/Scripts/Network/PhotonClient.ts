import { INetworkClient, NetworkEvent, MessageCode } from "./NetworkController";
import { PlayerInfo, RoomInfo } from "../Data/Data";

export const PHOTON_APP_ID = "8abf5256-456b-4a24-88ee-0b1f56f6f557";

function roomInfoConvert(info: Photon.LoadBalancing.RoomInfo): RoomInfo
{
    const room = new RoomInfo();
    room.playerCount = info.playerCount;
    room.roomName = info.name;
    room.maxPlayers = info.maxPlayers;
    room.masterDisplayName = info.getCustomProperty("roomMaster");
    return room;
}

function roomsInfoConvert(infos: Photon.LoadBalancing.RoomInfo[]): RoomInfo[]
{
    const roomInfo: RoomInfo[] = [];
    for (const info of infos)
    {
        roomInfo.push(roomInfoConvert(info));
    }
    return roomInfo;
}

function actorConvert(actor: Photon.LoadBalancing.Actor): PlayerInfo
{
    const player = new PlayerInfo();
    player.displayName = actor.name;
    player.inRoomUserId = actor.actorNr;
    player.isRoomMaster = actor.actorNr == 1;

    return player;
}

function actorsConvert(actors: Photon.LoadBalancing.Actor[]): PlayerInfo[]
{
    const players: PlayerInfo[] = [];
    for (const actor of actors)
    {
        players.push(actorConvert(actor));
    }
    return players;
}

export default class PhotonClient implements INetworkClient
{
    private logger: Exitgames.Common.Logger;
    private client: Photon.LoadBalancing.LoadBalancingClient;
    private onConnectionSuccess: Function = null;
    private onConnectionError: Function = null;

    constructor(displayName: string, auth: string, onSuccess: Function, onError: Function)
    {
        this.client = new Photon.LoadBalancing.LoadBalancingClient(Photon.ConnectionProtocol.Ws, PHOTON_APP_ID, "1.0");
        this.onConnectionSuccess = onSuccess;
        this.onConnectionError = onError;
        this.logger = new Exitgames.Common.Logger("Demo:");

        this.client.onEvent = this.onEvent.bind(this);
        this.client.onError = this.onError.bind(this);
        this.client.onStateChange = this.onStateChange.bind(this);
        this.client.onRoomListUpdate = this.onRoomListUpdate.bind(this);
        this.client.onActorJoin = this.onActorJoin.bind(this);
        this.client.onActorLeave = this.onActorLeave.bind(this);

        this.client.setCustomAuthentication(auth, Photon.LoadBalancing.Constants.CustomAuthenticationType.Custom);
        this.client.myActor().setName(displayName);
        this.client.connectToRegionMaster("asia");
    }

    public getMyUserIdInRoom(): number { return this.client.myActor().actorNr; }

    public getRooms(): RoomInfo[]
    {
        if (!this.client.isInLobby())
            return [];

        return roomsInfoConvert(this.client.availableRooms());
    }

    public getPlayersInRoom(): PlayerInfo[]
    {
        if (!this.client.isJoinedToRoom)
            return;

        return actorsConvert(this.client.myRoomActorsArray());
    }

    public createRoom(players: number = 4): void
    {
        if (!this.client.isInLobby())
            return;

        this.client.createRoom(null, { maxPlayers: players, customGameProperties: { roomMaster: this.client.myActor().name } });
    }

    public joinRoom(roomName: string = null): boolean
    {
        if (this.client.isJoinedToRoom())
        {
            if (this.client.myRoom().name == roomName)
            {
                return true;
            }
            return false;
        }

        if (roomName)
        {
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

    public leaveRoom(): void
    {
        if (this.client.myActor().actorNr == 1)
        {
            const room = this.client.myRoom();
            room.setIsOpen(false);
            room.setIsVisible(false);
        }
        this.client.leaveRoom();
    }

    sendMessage(eventCode: MessageCode, data: any, sendTo?: number[]): void
    {
        this.client.raiseEvent(eventCode, data, sendTo ? { targetActors: sendTo } : null);
    }

    //#region Internal Functions

    private onEvent(code: number, content: any, actorNr: number): void
    {
        let eventName: string = null;
        switch (code)
        {
            case MessageCode.GAME_MESSAGE:
                eventName = NetworkEvent.GAME_MESSAGE;
                break;
            case MessageCode.ROOM_MESSAGE:
                eventName = NetworkEvent.ROOM_MESSAGE;
                break;
        }

        if (eventName)
        {
            const map: any = this.client.myRoomActors();
            const player = actorConvert(map[actorNr]);
            cc.systemEvent.emit(eventName, content, player);
        }
    }

    private onError(errorCode: number, errorMsg: string): void
    {
        this.logger.error(errorMsg);
        if (this.onConnectionError)
            this.onConnectionError();

        this.onConnectionError = null;
        this.onConnectionSuccess = null;
    }

    private onStateChange(state: number): void
    {
        switch (state)
        {
            case Photon.LoadBalancing.LoadBalancingClient.State.JoinedLobby:
                if (this.onConnectionSuccess)
                    this.onConnectionSuccess();
                this.onConnectionSuccess = null;
                this.onConnectionError = null;
                break;

            case Photon.LoadBalancing.LoadBalancingClient.State.Joined:
                cc.systemEvent.emit(NetworkEvent.LOBBY_JOINED_ROOM, roomInfoConvert(this.client.myRoom()));

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
            cc.systemEvent.emit(NetworkEvent.LOBBY_ADD_ROOM, roomsInfoConvert(roomsAdded));
        }

        if (roomsRemoved.length > 0)
        {
            cc.systemEvent.emit(NetworkEvent.LOBBY_REMOVE_ROOM, roomsRemoved.map(x => x.name));
        }
    }

    private onActorJoin(actor: Photon.LoadBalancing.Actor): void
    {
        cc.systemEvent.emit(NetworkEvent.ROOM_ADD_PLAYER, actorConvert(actor));
    }

    private onActorLeave(actor: Photon.LoadBalancing.Actor, cleanup: boolean): void
    {
        cc.systemEvent.emit(NetworkEvent.ROOM_REMOVE_PLAYER, actorConvert(actor));
    }

    //#endregion
}