import { handleGuestbook } from "../../../src/workers/guestbook.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  return handleGuestbook(request, env, url);
}
