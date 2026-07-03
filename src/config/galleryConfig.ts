import type { GalleryConfig } from "@/types/config";

// 相册配置
export const galleryConfig: GalleryConfig = {
	// 相册列表
	albums: [
  {
    "id": "ai-2026",
    "name": "祖国人好好",
    "description": "逆天AI生图",
    "location": "沃特公司",
    "date": "2026-05-06",
    "tags": [
      "AI",
      "祖国人"
    ],
    "cover": "/gallery/ai-2026/1.webp"
  },
  {
    "id": "gpt-img2-2026",
    "name": "GPT生图",
    "description": "GPT生成的图片",
    "location": "gpt",
    "date": "2026-05-24",
    "tags": [
      "AI",
      "GPT生图"
    ],
    "cover": "/gallery/gpt-img2-2026/1.webp"
  },
  {
    "id": "mc-2026",
    "name": "鸣潮",
    "description": "鸣潮相册",
    "location": "鸣潮",
    "date": "2026-05-11",
    "tags": [
      "鸣潮"
    ],
    "cover": "/gallery/mc-2026/00001.webp"
  },
  {
    "id": "bl-ll-2026",
    "name": "萝莉",
    "description": "进来先电",
    "location": "碧蓝航线",
    "date": "2026-05-06",
    "tags": [
      "碧蓝航线",
      "萝莉"
    ],
    "cover": "/gallery/bl-ll-2026/00001.webp"
  }
],

	// 瀑布流最小列宽(px)，浏览器根据容器宽度自动计算列数，默认 240
	// 值越小列数越多，值越大列数越少
	columnWidth: 240,

	// 网络相册配置
	networkAlbum: {
		// 单次获取图片数量限制，默认 10
		maxQuantity: 10,
		// 默认获取数量，默认 6
		defaultQuantity: 6,
	},
};
