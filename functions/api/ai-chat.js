import { handleAIChat } from "../../src/workers/ai-chat.js";

export async function onRequest(context) {
  const { request, env } = context;
  return handleAIChat(request, env);
}
