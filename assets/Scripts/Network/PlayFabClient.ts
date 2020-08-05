import { Question } from "../Data/Data";
import { PHOTON_APP_ID } from "./PhotonClient";

const PLAYFAB_TITLE_ID = "FA963";

export default class PlayFabClient
{
    private playFabId: string = null;
    private playFabUserName: string = null;
    private playFabDisplayName: string = null;

    public get PlayFabId(): string { return this.playFabId; }
    public get PlayFabUserName(): string { return this.playFabUserName; }
    private getPhotonAuthTokenFormat(token: string) { return `username=${this.playFabId}&token=${token}`; }

    public constructor(playFabUserName: string, playFabDisplayName: string)
    {
        this.playFabUserName = playFabUserName;
        PlayFab.settings.titleId = PLAYFAB_TITLE_ID;
        this.playFabDisplayName = playFabDisplayName;
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
                if (result.data.NewlyCreated)
                {
                    const updateDisplayNameRequest = { Data: { "displayName": this.playFabDisplayName } } as PlayFabClientModels.UpdateUserDataRequest;
                    PlayFabClientSDK.UpdateUserData(updateDisplayNameRequest, null);
                }
                this.getAuthTokenForPhoton(onSuccess, onError);
            }
            else
            {
                onError(error.error);
            }
        };

        PlayFabClientSDK.LoginWithCustomID(loginRequest, loginResult);
    }

    public updateNickName(nickName: string)
    {
        let updateRequest = { DisplayName: nickName } as PlayFabClientModels.UpdateUserTitleDisplayNameRequest;
        PlayFabClientSDK.UpdateUserTitleDisplayName(updateRequest, null);
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