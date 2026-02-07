export interface AiRequest {
    model: string;
    messages: Array<{
        role: "user" | "assistant" | "system";
        content: string;
    }>;
    stream?: boolean;
    temperature?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    logprobs?: boolean;
    top_logprobs?: number;
}

