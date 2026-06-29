/**
 * 在线编辑模式 - 核心工具库
 * GitHub App 私钥认证方式：
 * 1. 导入 .pem 私钥文件 + 输入 App ID
 * 2. 浏览器端用 jsrsasign 用 RSA 私钥签名 JWT（有效期 ~9分钟）
 * 3. 用 JWT 通过 /repos/{owner}/{repo}/installation 获取 installation ID
 * 4. 用 JWT + installation ID 获取短期安装令牌（有效期 1 小时，缓存到 sessionStorage）
 * 5. 所有 API 请求使用安装令牌进行认证
 */

import { KJUR, KEYUTIL } from "jsrsasign";
import { repoConfig } from "@/config/editConfig";

const APP_ID_KEY = "gh_app_id";
const PRIVATE_KEY_KEY = "gh_app_private_key";
const INSTALL_TOKEN_KEY = "gh_install_token";
const INSTALL_TOKEN_EXPIRES_KEY = "gh_install_token_expires";

const GH_API = "https://api.github.com";

// ============ GitHub App 凭据管理 ============

export function getStoredAppId(): string {
	try {
		return localStorage.getItem(APP_ID_KEY) || "";
	} catch {
		return "";
	}
}

export function setStoredAppId(appId: string): void {
	try {
		localStorage.setItem(APP_ID_KEY, appId.trim());
	} catch {
		// ignore
	}
}

export function getStoredPrivateKey(): string {
	try {
		return localStorage.getItem(PRIVATE_KEY_KEY) || "";
	} catch {
		return "";
	}
}

export function setStoredPrivateKey(pem: string): void {
	try {
		localStorage.setItem(PRIVATE_KEY_KEY, pem.trim());
	} catch {
		// ignore
	}
}

export function clearStoredCredentials(): void {
	try {
		localStorage.removeItem(APP_ID_KEY);
		localStorage.removeItem(PRIVATE_KEY_KEY);
		sessionStorage.removeItem(INSTALL_TOKEN_KEY);
		sessionStorage.removeItem(INSTALL_TOKEN_EXPIRES_KEY);
	} catch {
		// ignore
	}
}

export function hasValidCredentials(): boolean {
	return !!getStoredAppId() && !!getStoredPrivateKey();
}

// ============ JWT 签名 ============

function signAppJwt(appId: string, privateKeyPem: string): string {
	const now = Math.floor(Date.now() / 1000);
	const header = { alg: "RS256", typ: "JWT" };
	const payload = { iat: now - 60, exp: now + 8 * 60, iss: appId };
	const prv = KEYUTIL.getKey(privateKeyPem) as unknown as string;
	return KJUR.jws.JWS.sign("RS256", JSON.stringify(header), JSON.stringify(payload), prv);
}

// ============ Installation Token 管理 ============

function getCachedInstallToken(): string | null {
	try {
		const token = sessionStorage.getItem(INSTALL_TOKEN_KEY);
		const expiresStr = sessionStorage.getItem(INSTALL_TOKEN_EXPIRES_KEY);
		if (!token || !expiresStr) return null;
		const expires = parseInt(expiresStr, 10);
		if (Date.now() >= expires - 60000) return null;
		return token;
	} catch {
		return null;
	}
}

function cacheInstallToken(token: string, expiresAt: string): void {
	try {
		const expiresMs = new Date(expiresAt).getTime();
		sessionStorage.setItem(INSTALL_TOKEN_KEY, token);
		sessionStorage.setItem(INSTALL_TOKEN_EXPIRES_KEY, String(expiresMs));
	} catch {
		// ignore
	}
}

function clearCachedInstallToken(): void {
	try {
		sessionStorage.removeItem(INSTALL_TOKEN_KEY);
		sessionStorage.removeItem(INSTALL_TOKEN_EXPIRES_KEY);
	} catch {
		// ignore
	}
}

async function fetchInstallationId(jwt: string): Promise<number> {
	const resp = await fetch(
		`${GH_API}/repos/${repoConfig.owner}/${repoConfig.repo}/installation`,
		{
			headers: {
				Authorization: `Bearer ${jwt}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
			},
		},
	);
	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		throw new Error(`获取 Installation ID 失败 (${resp.status}): ${text || resp.statusText}`);
	}
	const data = await resp.json();
	return data.id;
}

async function fetchInstallationToken(jwt: string, installationId: number): Promise<{ token: string; expires_at: string }> {
	const resp = await fetch(
		`${GH_API}/app/installations/${installationId}/access_tokens`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${jwt}`,
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
			},
		},
	);
	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		throw new Error(`获取安装令牌失败 (${resp.status}): ${text || resp.statusText}`);
	}
	const data = await resp.json();
	return { token: data.token, expires_at: data.expires_at };
}

/**
 * 获取有效的认证令牌（自动缓存、刷新）
 */
export async function getAuthToken(): Promise<string> {
	const cached = getCachedInstallToken();
	if (cached) return cached;

	const appId = getStoredAppId();
	const privateKey = getStoredPrivateKey();
	if (!appId || !privateKey) {
		throw new Error("未配置 GitHub App 凭据，请先导入私钥并输入 App ID");
	}

	const jwt = signAppJwt(appId, privateKey);
	const installationId = await fetchInstallationId(jwt);
	const { token, expires_at } = await fetchInstallationToken(jwt, installationId);
	cacheInstallToken(token, expires_at);
	return token;
}

/**
 * 兼容旧 API：hasValidToken 重命名为 hasValidCredentials
 */
export function hasValidToken(): boolean {
	return hasValidCredentials();
}

/**
 * 兼容旧 API：getStoredToken 返回空字符串（实际通过 getAuthToken 异步获取）
 */
export function getStoredToken(): string {
	return "";
}

/**
 * 兼容旧 API：setStoredToken 不再使用，保留空实现
 */
export function setStoredToken(_token: string): void {
	// no-op: GitHub App 模式下不直接存储 token
}

/**
 * 兼容旧 API：clearStoredToken 清除所有凭据
 */
export function clearStoredToken(): void {
	clearStoredCredentials();
}

/**
 * 验证 GitHub App 凭据是否有效
 * 1. 签名 JWT
 * 2. 获取 installation ID（验证 App 安装正确）
 * 3. 获取安装令牌（验证私钥正确）
 */
export async function validateCredentials(appId: string, privateKeyPem: string): Promise<{ ok: boolean; error?: string }> {
	if (!appId.trim()) return { ok: false, error: "请输入 App ID" };
	if (!privateKeyPem.trim() || !privateKeyPem.includes("BEGIN") || !privateKeyPem.includes("PRIVATE KEY")) {
		return { ok: false, error: "私钥格式不正确，请导入有效的 .pem 文件" };
	}
	try {
		const jwt = signAppJwt(appId.trim(), privateKeyPem.trim());
		const installationId = await fetchInstallationId(jwt);
		await fetchInstallationToken(jwt, installationId);
		return { ok: true };
	} catch (e) {
		return { ok: false, error: (e as Error).message || "验证失败" };
	}
}

// ============ 文件读取工具 ============

export function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result || ""));
		reader.onerror = reject;
		reader.readAsText(file);
	});
}

// ============ Gist API 封装 ============

export async function authHeaders(): Promise<Record<string, string>> {
	const token = await getAuthToken();
	return {
		Authorization: `Bearer ${token}`,
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};
}

export async function readGistFile(
	gistId: string,
	fileName: string,
): Promise<string | null> {
	try {
		const headers = await authHeaders();
		const resp = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
		if (!resp.ok) return null;
		const data = await resp.json();
		const file = data.files?.[fileName];
		return file?.content || null;
	} catch {
		return null;
	}
}

export async function writeGistFile(
	gistId: string,
	fileName: string,
	content: string,
): Promise<boolean> {
	try {
		const headers = await authHeaders();
		const resp = await fetch(`https://api.github.com/gists/${gistId}`, {
			method: "PATCH",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				files: {
					[fileName]: { content },
				},
			}),
		});
		return resp.ok;
	} catch {
		return false;
	}
}

export async function createGist(
	description: string,
	fileName: string,
	content: string,
): Promise<string | null> {
	try {
		const headers = await authHeaders();
		const resp = await fetch("https://api.github.com/gists", {
			method: "POST",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				description,
				public: false,
				files: {
					[fileName]: { content },
				},
			}),
		});
		if (!resp.ok) return null;
		const data = await resp.json();
		return data.id || null;
	} catch {
		return null;
	}
}

// ============ GitHub Repo 文件操作 ============

export interface RepoConfig {
	owner: string;
	repo: string;
	branch: string;
}

export async function getRepoFile(
	path: string,
	config: RepoConfig,
): Promise<{ content: string; sha: string } | null> {
	try {
		const headers = await authHeaders();
		const resp = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
			{ headers },
		);
		if (!resp.ok) return null;
		const data = await resp.json();
		const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
		return { content, sha: data.sha };
	} catch {
		return null;
	}
}

export async function updateRepoFile(
	path: string,
	content: string,
	sha: string,
	message: string,
	config: RepoConfig,
): Promise<boolean> {
	try {
		const headers = await authHeaders();
		const encodedContent = btoa(unescape(encodeURIComponent(content)));
		const resp = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
			{
				method: "PUT",
				headers: { ...headers, "Content-Type": "application/json" },
				body: JSON.stringify({
					message,
					content: encodedContent,
					sha,
					branch: config.branch,
				}),
			},
		);
		if (!resp.ok) {
			clearCachedInstallToken();
		}
		return resp.ok;
	} catch {
		clearCachedInstallToken();
		return false;
	}
}

export async function createRepoFile(
	path: string,
	content: string,
	message: string,
	config: RepoConfig,
): Promise<boolean> {
	try {
		const headers = await authHeaders();
		const encodedContent = btoa(unescape(encodeURIComponent(content)));
		const resp = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
			{
				method: "PUT",
				headers: { ...headers, "Content-Type": "application/json" },
				body: JSON.stringify({
					message,
					content: encodedContent,
					branch: config.branch,
				}),
			},
		);
		if (!resp.ok) {
			clearCachedInstallToken();
		}
		return resp.ok;
	} catch {
		clearCachedInstallToken();
		return false;
	}
}

export async function deleteRepoFile(
	path: string,
	sha: string,
	message: string,
	config: RepoConfig,
): Promise<boolean> {
	try {
		const headers = await authHeaders();
		const resp = await fetch(
			`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
			{
				method: "DELETE",
				headers: { ...headers, "Content-Type": "application/json" },
				body: JSON.stringify({
					message,
					sha,
					branch: config.branch,
				}),
			},
		);
		if (!resp.ok) {
			clearCachedInstallToken();
		}
		return resp.ok;
	} catch {
		clearCachedInstallToken();
		return false;
	}
}

// ============ 兼容旧的 validateToken ============

export async function validateToken(_token: string): Promise<boolean> {
	return hasValidCredentials();
}

// ============ Toast 通知 ============

export function showToast(
	message: string,
	type: "success" | "error" | "info" | "warning" = "info",
) {
	if (typeof window === "undefined") return;
	const event = new CustomEvent("edit-mode:toast", {
		detail: { message, type },
	});
	window.dispatchEvent(event);
}

// ============ 深拷贝工具 ============

export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

export function genId(prefix: string = "id"): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureIconify(): void {
	if (typeof window === "undefined") return;
	if ((window as any)._iconifyLoaded) return;
	(window as any)._iconifyLoaded = true;
	const script = document.createElement("script");
	script.src = "https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js";
	script.async = true;
	document.head.appendChild(script);
}
