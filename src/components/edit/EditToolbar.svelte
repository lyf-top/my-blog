<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();
	import {
		getStoredAppId,
		setStoredAppId,
		setStoredPrivateKey,
		clearStoredCredentials,
		hasValidCredentials,
		readFileAsText,
		validateCredentials,
		showToast,
		ensureIconify,
	} from "@/utils/editMode";

	let {
		pageName,
		saving,
		hasChanges,
		showAddButton = true,
		startInEditMode = false,
		persistentEdit = false,
		mountTo,
	}: {
		pageName: string;
		saving: boolean;
		hasChanges: boolean;
		showAddButton?: boolean;
		startInEditMode?: boolean;
		persistentEdit?: boolean;
		mountTo?: string;
	} = $props();

	let editMode = $state(false);
	let hasKey = $state(false);
	let showKeyModal = $state(false);
	let appIdInput = $state("");
	let validatingKey = $state(false);
	let pemFileName = $state("");
	let importedPem = $state("");

	let keyFileInput = $state<HTMLInputElement | null>(null);
	let toolbarRootEl = $state<HTMLDivElement>();
	let mountedExternally = false;
	let hiddenWrapper: HTMLElement | null = null;
	let mountTarget: Element | null = null;

	onMount(() => {
		ensureIconify();
		hasKey = hasValidCredentials();
		appIdInput = getStoredAppId();
		if (startInEditMode) {
			editMode = true;
		}
		if (mountTo) {
			mountTarget = document.querySelector(mountTo);
			moveToolbar();
		}
		return () => {
			if (hiddenWrapper) {
				hiddenWrapper.style.display = "";
			}
		};
	});

	function moveToolbar() {
		if (mountTo && toolbarRootEl && mountTarget && !mountedExternally) {
			const wrapper = toolbarRootEl.parentElement;
			if (wrapper && wrapper !== mountTarget) {
				hiddenWrapper = wrapper as HTMLElement;
				hiddenWrapper.style.display = "none";
			}
			const firstChild = mountTarget.firstChild;
			if (firstChild) {
				mountTarget.insertBefore(toolbarRootEl, firstChild);
			} else {
				mountTarget.appendChild(toolbarRootEl);
			}
			mountedExternally = true;
		}
	}

	$effect(() => {
		if (mountTo && toolbarRootEl && mountTarget) {
			moveToolbar();
		}
		return () => {
			if (mountedExternally && toolbarRootEl && toolbarRootEl.parentNode) {
				toolbarRootEl.parentNode.removeChild(toolbarRootEl);
			}
		};
	});

	function enterEdit() {
		editMode = true;
		dispatch("modeChange", { editing: true });
	}

	function cancelEdit() {
		if (hasChanges && !confirm("你有未保存的更改，确定要取消吗？所有修改将丢失。")) {
			return;
		}
		if (!persistentEdit) {
			editMode = false;
			dispatch("modeChange", { editing: false });
		}
		dispatch("cancel");
	}

	function handleImportKey() {
		if (hasKey) {
			if (confirm("已导入私钥。点击确定重新导入，点击取消保留当前密钥。")) {
				appIdInput = getStoredAppId();
				importedPem = "";
				pemFileName = "";
				showKeyModal = true;
			}
			return;
		}
		appIdInput = getStoredAppId();
		importedPem = "";
		pemFileName = "";
		showKeyModal = true;
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			input.value = "";
			return;
		}
		pemFileName = file.name;
		readFileAsText(file).then((content) => {
			importedPem = content;
			if (!content.includes("BEGIN") || !content.includes("PRIVATE KEY")) {
				showToast("请选择有效的 GitHub App 私钥文件（.pem 格式）", "warning");
			}
		}).catch(() => {
			showToast("读取文件失败", "error");
		});
		input.value = "";
	}

	function triggerFileSelect() {
		keyFileInput?.click();
	}

	async function handleSaveKey() {
		const trimmedAppId = appIdInput.trim();
		if (!trimmedAppId) {
			showToast("请输入 GitHub App ID", "warning");
			return;
		}
		if (!importedPem) {
			showToast("请选择 .pem 私钥文件", "warning");
			return;
		}
		if (!importedPem.includes("BEGIN") || !importedPem.includes("PRIVATE KEY")) {
			showToast("私钥格式不正确，请导入有效的 .pem 文件", "error");
			return;
		}

		validatingKey = true;
		const result = await validateCredentials(trimmedAppId, importedPem);
		validatingKey = false;

		if (!result.ok) {
			showToast(`验证失败：${result.error}`, "error");
			return;
		}

		setStoredAppId(trimmedAppId);
		setStoredPrivateKey(importedPem);
		hasKey = true;
		showKeyModal = false;
		showToast("GitHub App 私钥导入成功！", "success");
		dispatch("tokenReady");
	}

	function clearKey() {
		clearStoredCredentials();
		hasKey = false;
		appIdInput = "";
		importedPem = "";
		pemFileName = "";
		showToast("已清除密钥", "info");
	}

	function handleAdd() {
		dispatch("add");
	}

	function handleSave() {
		if (!hasValidCredentials()) {
			showToast("请先导入 GitHub App 私钥再保存", "warning");
			showKeyModal = true;
			return;
		}
		dispatch("save");
	}

	function closeKeyModal() {
		showKeyModal = false;
	}
</script>

<!-- 单一容器，内部条件渲染内容 -->
<div class="edit-toolbar" bind:this={toolbarRootEl} class:edit-toolbar--mounted={mountedExternally} class:edit-mode-toolbar={editMode}>
	{#if !editMode}
		<button class="edit-main-btn" onclick={enterEdit} title={`编辑${pageName}`}>
			<iconify-icon icon="material-symbols:edit-rounded" class="text-base"></iconify-icon>
			编辑{pageName}
		</button>
	{:else}
		<button class="edit-btn edit-btn-cancel" onclick={cancelEdit} title={persistentEdit ? "重置更改" : "取消编辑"}>
			<iconify-icon icon={persistentEdit ? "material-symbols:undo-rounded" : "material-symbols:close-rounded"} class="text-sm"></iconify-icon>
			{persistentEdit ? "重置" : "取消"}
		</button>
		<button
			class="edit-btn edit-btn-key"
			class:edit-btn-key-active={hasKey}
			onclick={handleImportKey}
			title={hasKey ? "已导入私钥，点击重新导入" : "点击导入 GitHub App 私钥"}
		>
			<iconify-icon
				icon={hasKey ? "material-symbols:check-circle-rounded" : "material-symbols:vpn-key-rounded"}
				class="text-sm"
			></iconify-icon>
			{hasKey ? "已导入" : "导入密钥"}
		</button>
		{#if showAddButton !== false}
			<button class="edit-btn edit-btn-add" onclick={handleAdd}>
				<iconify-icon icon="material-symbols:add-rounded" class="text-base"></iconify-icon>
				添加
			</button>
		{/if}
		<button
			class="edit-btn edit-btn-save"
			onclick={handleSave}
			disabled={saving}
		>
			{#if saving}
				<iconify-icon icon="material-symbols:progress-activity-rounded" class="text-base animate-spin"></iconify-icon>
				保存中...
			{:else}
				<iconify-icon icon="material-symbols:save-rounded" class="text-base"></iconify-icon>
				保存
			{/if}
		</button>

		<input
			bind:this={keyFileInput}
			type="file"
			accept=".pem,.key,application/x-pem-file"
			style="display:none"
			onchange={handleFileSelect}
		/>
	{/if}
</div>

<!-- GitHub App 密钥配置弹窗 -->
{#if showKeyModal}
	<div class="key-modal-overlay" onclick={closeKeyModal}>
		<div class="key-modal" onclick={(e) => e.stopPropagation()}>
			<div class="key-modal-header">
				<h3>
					<iconify-icon icon="material-symbols:vpn-key-rounded" class="text-lg mr-2"></iconify-icon>
					GitHub App 私钥配置
				</h3>
				<button class="key-modal-close" onclick={closeKeyModal}>
					<iconify-icon icon="material-symbols:close-rounded" class="text-xl"></iconify-icon>
				</button>
			</div>
			<div class="key-modal-body">
				<p class="key-modal-desc">
					请输入您的 GitHub App ID 并导入私钥文件（.pem）。需要在 GitHub 上创建一个 GitHub App 并安装到您的博客仓库，授予 <strong>Contents: Read &amp; Write</strong> 权限（如需编辑说说/友链/收藏等 Gist 数据，还需 <strong>Gists: Read &amp; Write</strong> 权限）。
				</p>

				<label class="key-field-label">
					<iconify-icon icon="material-symbols:apps-rounded" class="text-sm"></iconify-icon>
					App ID
				</label>
				<input
					type="text"
					bind:value={appIdInput}
					placeholder="例如：123456"
					class="key-input"
				/>

				<label class="key-field-label">
					<iconify-icon icon="material-symbols:description-rounded" class="text-sm"></iconify-icon>
					私钥文件（.pem）
				</label>
				<div class="key-file-area">
					<button type="button" class="key-file-btn" onclick={triggerFileSelect}>
						<iconify-icon icon="material-symbols:upload-file-rounded" class="text-base"></iconify-icon>
						{pemFileName ? "重新选择文件" : "选择 .pem 文件"}
					</button>
					{pemFileName && (
						<span class="key-file-name">
							<iconify-icon icon="material-symbols:check-circle-rounded" class="text-sm text-green-500"></iconify-icon>
							{pemFileName}
						</span>
					)}
				</div>

				<div class="key-help">
					<details>
						<summary>
							<iconify-icon icon="material-symbols:help-outline-rounded" class="text-sm"></iconify-icon>
							如何创建 GitHub App 并获取私钥？
						</summary>
						<div class="key-help-content">
							<ol>
								<li>前往 GitHub <strong>Settings → Developer settings → GitHub Apps</strong></li>
								<li>点击 <strong>New GitHub App</strong></li>
								<li>填写名称、Homepage URL（博客地址）、Webhook URL 可留空（取消 Active webhook）</li>
								<li>在 <strong>Repository permissions</strong> 中：
									<ul>
										<li>Contents: Read &amp; write</li>
										<li>Gists: Read &amp; write（可选，用于友链/说说/收藏等）</li>
									</ul>
								</li>
								<li>选择 <strong>Only on this account</strong> 后创建</li>
								<li>创建后在 App 详情页找到 <strong>App ID</strong>（数字）</li>
								<li>下滑到 <strong>Private keys</strong> 点击 <strong>Generate a private key</strong> 下载 .pem 文件</li>
								<li>左侧菜单点击 <strong>Install App</strong>，安装到您的博客仓库</li>
							</ol>
						</div>
					</details>
				</div>

				{#if hasKey && !validatingKey}
					<button class="key-clear-btn" onclick={clearKey}>
						<iconify-icon icon="material-symbols:delete-outline-rounded" class="text-sm"></iconify-icon>
						清除已保存的密钥
					</button>
				{/if}
			</div>
			<div class="key-modal-footer">
				<button class="key-btn key-btn-cancel" onclick={closeKeyModal}>取消</button>
				<button class="key-btn key-btn-confirm" onclick={handleSaveKey} disabled={validatingKey}>
					{#if validatingKey}
						<iconify-icon icon="material-symbols:progress-activity-rounded" class="text-sm animate-spin mr-1"></iconify-icon>
						验证中...
					{:else}
						<iconify-icon icon="material-symbols:check-rounded" class="text-sm mr-1"></iconify-icon>
						确认导入
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.edit-toolbar {
		display: inline-flex;
		justify-content: flex-start;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
		flex-wrap: wrap;
		vertical-align: middle;
	}

	.edit-toolbar--mounted {
		margin-bottom: 0;
	}

	.edit-main-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.9);
		background: transparent;
		color: rgba(0, 0, 0, 0.9);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s, color 0.2s;
		white-space: nowrap;
		line-height: 1.5;
		height: auto;
	}
	.edit-main-btn:hover {
		background: rgba(0, 0, 0, 0.9);
		color: white;
	}
	:global(.dark) .edit-main-btn {
		border-color: rgba(255, 255, 255, 0.9);
		color: rgba(255, 255, 255, 0.9);
	}
	:global(.dark) .edit-main-btn:hover {
		background: rgba(255, 255, 255, 0.9);
		color: rgba(0, 0, 0, 0.9);
	}

	.edit-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 7px 14px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid transparent;
		background: transparent;
		white-space: nowrap;
	}

	.edit-btn-cancel {
		border-color: rgba(0, 0, 0, 0.15);
		color: rgba(0, 0, 0, 0.6);
	}
	.edit-btn-cancel:hover {
		border-color: rgba(0, 0, 0, 0.9);
		color: white;
		background: rgba(0, 0, 0, 0.9);
	}
	:global(.dark) .edit-btn-cancel {
		border-color: rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.6);
	}
	:global(.dark) .edit-btn-cancel:hover {
		border-color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.9);
		color: rgba(0, 0, 0, 0.9);
	}

	.edit-btn-key {
		border-color: rgba(0, 0, 0, 0.15);
		color: rgba(0, 0, 0, 0.6);
	}
	.edit-btn-key:hover {
		border-color: hsl(var(--theme-hue, 165), 70%, 45%);
		color: hsl(var(--theme-hue, 165), 70%, 40%);
	}
	.edit-btn-key-active {
		border-color: #22c55e !important;
		color: #16a34a !important;
		background: rgba(34, 197, 94, 0.08) !important;
	}
	:global(.dark) .edit-btn-key {
		border-color: rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.6);
	}
	:global(.dark) .edit-btn-key:hover {
		border-color: hsl(var(--theme-hue, 165), 70%, 55%);
		color: hsl(var(--theme-hue, 165), 70%, 60%);
	}
	:global(.dark) .edit-btn-key-active {
		border-color: #4ade80 !important;
		color: #4ade80 !important;
		background: rgba(74, 222, 128, 0.12) !important;
	}

	.edit-btn-add {
		border-color: rgba(0, 0, 0, 0.15);
		color: rgba(0, 0, 0, 0.6);
	}
	.edit-btn-add:hover {
		border-color: hsl(var(--theme-hue, 165), 70%, 45%);
		background: hsla(var(--theme-hue, 165), 70%, 50%, 0.1);
		color: hsl(var(--theme-hue, 165), 70%, 40%);
	}
	:global(.dark) .edit-btn-add {
		border-color: rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.6);
	}
	:global(.dark) .edit-btn-add:hover {
		border-color: hsl(var(--theme-hue, 165), 70%, 55%);
		background: hsla(var(--theme-hue, 165), 70%, 50%, 0.15);
		color: hsl(var(--theme-hue, 165), 70%, 60%);
	}

	.edit-btn-save {
		border: 1px solid hsl(var(--theme-hue, 165), 70%, 50%);
		background: hsl(var(--theme-hue, 165), 70%, 50%);
		color: white;
		font-weight: 600;
	}
	.edit-btn-save:hover:not(:disabled) {
		background: hsl(var(--theme-hue, 165), 75%, 45%);
		border-color: hsl(var(--theme-hue, 165), 75%, 45%);
	}
	.edit-btn-save:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* ====== 密钥配置弹窗 ====== */
	.key-modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		z-index: 9998;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		animation: fadeIn 0.2s ease;
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.key-modal {
		background: var(--card-bg, white);
		border-radius: 16px;
		width: 100%;
		max-width: 480px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.25s ease;
		overflow: hidden;
		border: 1px solid var(--border, rgba(0,0,0,0.08));
		max-height: 90vh;
		overflow-y: auto;
	}
	@keyframes slideUp {
		from { transform: translateY(20px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}
	:global(.dark) .key-modal {
		background: #1a1a2e;
		border-color: rgba(255, 255, 255, 0.1);
	}

	.key-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px 12px;
		border-bottom: 1px solid var(--border, rgba(0,0,0,0.08));
		flex-shrink: 0;
	}
	:global(.dark) .key-modal-header {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}
	.key-modal-header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 700;
		display: flex;
		align-items: center;
		color: var(--text-color, #1a1a2e);
	}
	:global(.dark) .key-modal-header h3 {
		color: #f0f0f0;
	}
	.key-modal-close {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		border: none;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #888;
		transition: all 0.15s;
	}
	.key-modal-close:hover {
		background: rgba(0, 0, 0, 0.06);
		color: #333;
	}
	:global(.dark) .key-modal-close:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.key-modal-body {
		padding: 16px 20px;
	}
	.key-modal-desc {
		margin: 0 0 16px;
		font-size: 13px;
		color: var(--text-secondary, #666);
		line-height: 1.7;
	}
	:global(.dark) .key-modal-desc {
		color: #aaa;
	}
	.key-modal-desc strong {
		color: hsl(var(--theme-hue, 165), 70%, 45%);
	}

	.key-field-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-color, #1f2937);
		margin-bottom: 6px;
		margin-top: 12px;
	}
	:global(.dark) .key-field-label {
		color: #d1d5db;
	}

	.key-input {
		width: 100%;
		padding: 10px 14px;
		border: 1.5px solid var(--border, #d1d5db);
		border-radius: 10px;
		font-size: 14px;
		background: var(--bg-color, white);
		color: var(--text-color, #1f2937);
		outline: none;
		transition: border-color 0.2s;
		box-sizing: border-box;
		font-family: monospace;
	}
	.key-input:focus {
		border-color: hsl(var(--theme-hue, 165), 70%, 50%);
		box-shadow: 0 0 0 3px hsla(var(--theme-hue, 165), 70%, 50%, 0.1);
	}
	:global(.dark) .key-input {
		background: #0f0f1a;
		border-color: #374151;
		color: #e5e7eb;
	}

	.key-file-area {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.key-file-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 9px 16px;
		border-radius: 10px;
		border: 1.5px dashed hsl(var(--theme-hue, 165), 70%, 50%);
		background: hsla(var(--theme-hue, 165), 70%, 50%, 0.05);
		color: hsl(var(--theme-hue, 165), 70%, 45%);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}
	.key-file-btn:hover {
		background: hsla(var(--theme-hue, 165), 70%, 50%, 0.12);
	}
	:global(.dark) .key-file-btn {
		color: hsl(var(--theme-hue, 165), 70%, 60%);
		background: hsla(var(--theme-hue, 165), 70%, 50%, 0.1);
	}

	.key-file-name {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 13px;
		color: #16a34a;
		font-weight: 500;
	}
	:global(.dark) .key-file-name {
		color: #4ade80;
	}

	.key-help {
		margin-top: 16px;
		font-size: 12px;
		color: var(--text-secondary, #666);
	}
	:global(.dark) .key-help {
		color: #999;
	}
	.key-help summary {
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 4px;
		font-weight: 500;
		color: hsl(var(--theme-hue, 165), 70%, 45%);
		user-select: none;
	}
	.key-help summary:hover {
		text-decoration: underline;
	}
	.key-help-content {
		margin-top: 10px;
		padding: 12px;
		background: var(--bg-secondary, rgba(0,0,0,0.02));
		border-radius: 8px;
		line-height: 1.8;
	}
	:global(.dark) .key-help-content {
		background: rgba(255,255,255,0.04);
	}
	.key-help-content ol {
		margin: 0;
		padding-left: 18px;
	}
	.key-help-content ul {
		margin: 4px 0;
		padding-left: 18px;
	}
	.key-help-content li {
		margin-bottom: 4px;
	}

	.key-clear-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin-top: 16px;
		padding: 6px 12px;
		border-radius: 8px;
		border: 1px solid rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.05);
		color: #ef4444;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.key-clear-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
	}
	:global(.dark) .key-clear-btn {
		color: #f87171;
		border-color: rgba(248, 113, 113, 0.3);
		background: rgba(248, 113, 113, 0.08);
	}

	.key-modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding: 14px 20px;
		border-top: 1px solid var(--border, rgba(0,0,0,0.08));
		flex-shrink: 0;
	}
	:global(.dark) .key-modal-footer {
		border-top-color: rgba(255, 255, 255, 0.1);
	}
	.key-btn {
		padding: 8px 18px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		border: none;
		display: inline-flex;
		align-items: center;
	}
	.key-btn-cancel {
		background: var(--bg-secondary, #f3f4f6);
		color: var(--text-color, #374151);
	}
	.key-btn-cancel:hover {
		background: var(--border, #e5e7eb);
	}
	:global(.dark) .key-btn-cancel {
		background: #2d2d44;
		color: #d1d5db;
	}
	:global(.dark) .key-btn-cancel:hover {
		background: #3d3d55;
	}
	.key-btn-confirm {
		background: hsl(var(--theme-hue, 165), 70%, 50%);
		color: white;
	}
	.key-btn-confirm:hover:not(:disabled) {
		background: hsl(var(--theme-hue, 165), 75%, 45%);
	}
	.key-btn-confirm:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
