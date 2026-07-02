// 书架配置 - 类似 friendsConfig.ts 的 TS 形式
// 编辑器保存时会直接更新此文件

export interface BookItem {
	id: string;
	title: string;
	name_cn: string;
	category: string;
	status: number; // 1=想看 2=看过 3=在看 4=搁置 5=抛弃
	score: number;
	image: string;
	tags: string[];
	comment: string;
	updated_at: string;
}

// 书架页面配置
export const booksPageConfig = {
	enable: true,
	editable: true,
};

// 书架数据配置
export const booksConfig: BookItem[] = [
	{
		id: "book/心理/认知觉醒开启自我改变的原动力",
		title: "认知觉醒：开启自我改变的原动力",
		name_cn: "测试认知觉醒：开启自我改变的原动力",
		category: "book",
		status: 1,
		score: 0,
		image: "https://cdn.weread.qq.com/weread/cover/86/YueWen_33628204/t6_YueWen_33628204.jpg",
		tags: ["心理-认知与行为", "周岭"],
		comment: "",
		updated_at: "2026-07-01T22:45:41.594Z",
	},
	{
		id: "book/个人成长/人性的弱点",
		title: "人性的弱点（卡耐基经典励志系列）",
		name_cn: "人性的弱点（卡耐基经典励志系列）",
		category: "book",
		status: 2,
		score: 0,
		image: "https://cdn.weread.qq.com/weread/cover/35/YueWen_918483/t6_YueWen_918483.jpg",
		tags: ["个人成长-沟通表达", "卡耐基"],
		comment: "",
		updated_at: "2026-05-10T00:00:00.000Z",
	},
	{
		id: "book/经济理财/冯唐成事心法",
		title: "冯唐成事心法",
		name_cn: "冯唐成事心法",
		category: "book",
		status: 2,
		score: 0,
		image: "https://cdn.weread.qq.com/weread/cover/22/YueWen_35138325/t6_YueWen_35138325.jpg",
		tags: ["经济理财-管理", "冯唐"],
		comment: "",
		updated_at: "2026-04-15T00:00:00.000Z",
	},
	{
		id: "book/文学/追风筝的人",
		title: "追风筝的人（珍藏纪念版）",
		name_cn: "追风筝的人（珍藏纪念版）",
		category: "book",
		status: 2,
		score: 0,
		image: "https://cdn.weread.qq.com/weread/cover/46/yuewen_546339/t6_yuewen_5463391747707629.jpg",
		tags: ["文学-外国文学", "卡勒德·胡赛尼"],
		comment: "",
		updated_at: "2025-06-06T00:00:00.000Z",
	},
	{
		id: "book/文学/啊20",
		title: "啊2.0",
		name_cn: "啊2.0",
		category: "book",
		status: 2,
		score: 0,
		image: "https://cdn.weread.qq.com/weread/cover/58/YueWen_33629539/t6_YueWen_33629539.jpg",
		tags: ["文学-散文杂著", "大冰"],
		comment: "",
		updated_at: "2025-04-25T00:00:00.000Z",
	},
	{
		id: "book/精品小说/被嫌弃的松子的一生",
		title: "被嫌弃的松子的一生（2021版｜同名电影原著）",
		name_cn: "被嫌弃的松子的一生（2021版｜同名电影原著）",
		category: "book",
		status: 2,
		score: 0,
		image: "https://cdn.weread.qq.com/weread/cover/50/YueWen_36927214/t6_YueWen_36927214.jpg",
		tags: ["精品小说-女性小说", "山田宗树"],
		comment: "",
		updated_at: "2025-04-15T00:00:00.000Z",
	},
	{
		id: "book/精品小说/恶意",
		title: "恶意",
		name_cn: "恶意",
		category: "book",
		status: 2,
		score: 0,
		image: "https://cdn.weread.qq.com/weread/cover/29/3300020529/t6_3300020529.jpg",
		tags: ["精品小说-悬疑推理", "东野圭吾"],
		comment: "",
		updated_at: "2025-04-12T00:00:00.000Z",
	},
	{
		id: "book/哲学宗教/强者思维",
		title: "强者思维",
		name_cn: "强者思维",
		category: "book",
		status: 2,
		score: 0,
		image: "https://cdn.weread.qq.com/weread/cover/50/cpplatform_ohulsqfabtcppehqdqtmcr/t6_cpplatform_ohulsqfabtcppehqdqtmcr1696758968.jpg",
		tags: ["哲学宗教-思维科学", "陈宇"],
		comment: "",
		updated_at: "2025-03-10T00:00:00.000Z",
	},
	{
		id: "book/乖摸摸头",
		title: "乖摸摸头",
		name_cn: "乖摸摸头",
		category: "book",
		status: 2,
		score: 0,
		image: "https://re.tsh520.cn/Bcover/s27466554.jpg",
		tags: ["小说"],
		comment: "",
		updated_at: "2019-03-31T00:00:00.000Z",
	},
];
