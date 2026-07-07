import { handleGithubProxy } from "../../lib/github-proxy.js";

export async function onRequest(context) {
  const { request, env } = context;
  return handleGithubProxy(request, env);
}
