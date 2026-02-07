import { AiRequest } from "../types/ai";

export class AI{
    api: string;
    private _api_key: string;
    constructor(api: string, api_key: string){
        this.api = api;
        this._api_key = api_key;
    }

    get api_key(){
        return this._api_key.slice(5)+"*".repeat(this._api_key.length-5);
    }

    async request(params: AiRequest){
        const response = await fetch(this.api, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this._api_key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        });
        return await response.json();
    }
}

