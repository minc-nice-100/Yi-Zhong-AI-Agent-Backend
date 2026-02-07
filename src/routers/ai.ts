import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import { AiRequest } from "../types/ai";
import { AI } from "../services/ai";

const AiRequest_Example: AiRequest = {
    model: "deepseek-chat",
    messages: [
        {
            role: "user",
            content: "你好",
        },
    ]
};

