import type { ProfileConfig } from "../types/config";

export const profileConfig: ProfileConfig = {
	// 头像
	// 图片路径支持三种格式：
	// 1. public 目录（以 "/" 开头，不优化）："/assets/images/avatar.webp"
	// 2. src 目录（不以 "/" 开头，自动优化但会增加构建时间，推荐）："assets/images/avatar.webp"
	// 3. 远程 URL："https://example.com/avatar.jpg"
	avatar: "assets/images/shangban.png",

	// 下班时间头像（为空则始终使用上方 avatar）
	avatarOffWork: "assets/images/xiaban.gif",

	// 名字
	name: "一飞",

	// 首页展示名字（留空则使用 name）
	displayName: "一飞の博客",

	// 名字右侧徽章文字（如 QQ 号）
	nameBadge: "B站：一飞c-",

	// 职业/身份标签
	occupation: "[啥都不会/ 无技术博主]",

	// 个人签名（支持多条，会循环打字+删除效果）
	bio: ["躬身入局，心为主理，行有尺度，自持本心."],

	// 链接配置
	// 已经预装的图标集：fa7-brands，fa7-regular，fa7-solid，material-symbols，simple-icons
	// 访问https://icones.js.org/ 获取图标代码，
	// 如果想使用尚未包含相应的图标集，则需要安装它
	// `pnpm add @iconify-json/<icon-set-name>`
	// showName: true 时显示图标和名称，false 时只显示图标
	links: [

		{
			name: "B站",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/2017273493",
			showName: false,
		},
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/lyf-top",
			showName: false,
		},
		{
			name: "Email",
			icon: "fa7-solid:envelope",
			url: "mailto:2860556024@qq.com",
			showName: false,
		},
		{
			name: "RSS",
			icon: "fa7-solid:rss",
			url: "/rss/",
			showName: false,
		},
		{
			name: "my home",
			url: "https://site.f3f3.top",
			icon: "fa7-solid:house-chimney",
			showName: false,
		},
	],
};
