import { handleAIChat } from "../lib/ai-chat.js";

export async function onRequest(context) {
  const { request, env } = context;
  return handleAIChat(request, env);
}
