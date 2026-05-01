import { type Category, type RecommendableItem } from './recommendation'
import { getWaveLevel } from './wave'

const CREATORS = [
  { id: 'u1', name: '夜猫子阿明', avatar: '🌙', level: 3, followerCount: 2300 },
  { id: 'u2', name: 'AI玩家小王', avatar: '🤖', level: 5, followerCount: 15000 },
  { id: 'u3', name: '音乐拾荒者', avatar: '🎵', level: 4, followerCount: 8900 },
  { id: 'u4', name: '摆摊青年', avatar: '🏪', level: 2, followerCount: 450 },
  { id: 'u5', name: '铲屎官日记', avatar: '🐱', level: 3, followerCount: 5600 },
  { id: 'u6', name: '旅行探索者', avatar: '✈️', level: 6, followerCount: 34000 },
  { id: 'u7', name: '效率达人', avatar: '⚡', level: 4, followerCount: 12000 },
  { id: 'u8', name: '街头实验', avatar: '🎤', level: 5, followerCount: 28000 },
  { id: 'u9', name: '声音收藏家', avatar: '🎧', level: 3, followerCount: 3400 },
  { id: 'u10', name: '打工人日记', avatar: '🌅', level: 2, followerCount: 890 },
  { id: 'u11', name: '独立导演小刘', avatar: '🎬', level: 4, followerCount: 6700 },
  { id: 'u12', name: '社区志愿者李阿姨', avatar: '❤️', level: 1, followerCount: 120 },
  { id: 'u13', name: '读书笔记', avatar: '📖', level: 3, followerCount: 7800 },
  { id: 'u14', name: '游戏测评员', avatar: '🎮', level: 5, followerCount: 45000 },
  { id: 'u15', name: '美食侦探', avatar: '🍜', level: 4, followerCount: 19000 },
]

const MOVIES = [
  { title: '宇宙探索编辑部', desc: '年度最佳国产片，票房惨淡', tags: ['科幻', '独立', '喜剧'] },
  { title: '漫长的季节', desc: '被低估的悬疑神剧', tags: ['悬疑', '国产', '剧情'] },
  { title: '流浪地球3', desc: '中国科幻巅峰之作', tags: ['科幻', '国产', '大片'] },
  { title: '奥本海默', desc: '诺兰的又一部杰作', tags: ['传记', '历史', '科幻'] },
  { title: '铃芽之旅', desc: '新海诚最新治愈动画', tags: ['动画', '日本', '治愈'] },
]

const TVSHOWS = [
  { title: '我的阿勒泰', desc: '治愈系神剧', tags: ['治愈', '国产', '生活'] },
  { title: '繁花', desc: '王家卫的电视剧首秀', tags: ['国产', '剧情', '上海'] },
  { title: '三体', desc: '中国科幻巨作改编', tags: ['科幻', '国产', '悬疑'] },
]

const BOOKS = [
  { title: '三体', desc: '中国科幻巅峰之作', tags: ['科幻', '国产', '经典'] },
  { title: '被讨厌的勇气', desc: '改变思维方式的书', tags: ['心理', '哲学', '成长'] },
  { title: '置身事内', desc: '理解中国经济的必读书', tags: ['经济', '中国', '社科'] },
  { title: '额尔古纳河右岸', desc: '迟子建的鄂温克族史诗', tags: ['文学', '国产', '民族'] },
  { title: '人类简史', desc: '重新理解人类文明', tags: ['历史', '社科', '科普'] },
]

const GAMES = [
  { title: '黑神话悟空', desc: '国产3A大作', tags: ['国产', '动作', 'RPG'] },
  { title: '星露谷物语', desc: '治愈农场经营', tags: ['独立', '模拟', '治愈'] },
  { title: '原神', desc: '开放世界冒险', tags: ['国产', '二次元', 'RPG'] },
  { title: '艾尔登法环', desc: '宫崎英高的新神作', tags: ['动作', 'RPG', '开放世界'] },
]

const MUSIC = [
  { title: '深夜电台独立乐队', desc: '网易云评论不到100', tags: ['独立', '民谣', '小众'] },
  { title: '万能青年旅店', desc: '中国最好的摇滚乐队', tags: ['摇滚', '国产', '独立'] },
  { title: '落日飞车', desc: '台湾迷幻摇滚', tags: ['摇滚', '台湾', '迷幻'] },
]

const PRODUCTS = [
  { title: '国产平替耳机', desc: '200块音质吊打千元大牌', tags: ['数码', '平替', '好物'] },
  { title: '小米手环9', desc: '百元级最强智能手环', tags: ['数码', '小米', '健康'] },
  { title: '故宫文创笔记本', desc: '最美的国产文具', tags: ['文创', '国产', '设计'] },
]

const CONCERTS = [
  { title: '草莓音乐节2026', desc: '国内最大的音乐节', tags: ['音乐节', '线下', '摇滚'] },
  { title: '万青专场演唱会', desc: '十年等一回', tags: ['演唱会', '摇滚', '线下'] },
]

const PERSONS = [
  { title: '街头歌手老张', desc: '唱了20年没人知道', tags: ['音乐', '素人', '街头'] },
  { title: '社区志愿者李阿姨', desc: '坚持10年帮邻居修东西', tags: ['公益', '素人', '社区'] },
  { title: '独立导演小刘', desc: '一个人拍了一部长片', tags: ['电影', '独立', '创作'] },
]

const CONTENTS = [
  { title: '凌晨三点的城市', desc: '每个城市都有不为人知的故事', tags: ['生活', '记录', '城市'] },
  { title: '辞职摆摊第30天', desc: '从月薪2万到日入300', tags: ['创业', '生活', '记录'] },
  { title: '用AI画了一幅画', desc: '当技术遇见创意', tags: ['AI', '创意', '艺术'] },
  { title: '租房避坑指南', desc: '5年租房经验总结', tags: ['生活', '干货', '租房'] },
]

const CATALOGS: Record<Category, Array<{ title: string; desc: string; tags: string[] }>> = {
  movie: MOVIES, tvshow: TVSHOWS, book: BOOKS, game: GAMES,
  music: MUSIC, concert: CONCERTS, product: PRODUCTS, person: PERSONS, content: CONTENTS,
}

const rand = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

let counter = 0

export function makeItem(category?: Category): RecommendableItem {
  const cat = category || rand(Object.keys(CATALOGS) as Category[])
  const tpl = rand(CATALOGS[cat])
  const creator = rand(CREATORS)
  const rarity: RecommendableItem['rarity'] = Math.random() < 0.03 ? 'legendary' : Math.random() < 0.15 ? 'epic' : Math.random() < 0.4 ? 'rare' : 'common'
  const views = randInt(1000, 100000)

  return {
    id: `item-${counter++}`,
    category: cat,
    title: tpl.title,
    description: tpl.desc,
    tags: tpl.tags,
    creator,
    rarity,
    stats: {
      views,
      likes: randInt(Math.floor(views * 0.05), Math.floor(views * 0.3)),
      promotes: randInt(10, 500),
      shares: randInt(5, 200),
      comments: randInt(10, 1000),
      favorites: randInt(20, 500),
      completions: randInt(Math.floor(views * 0.3), Math.floor(views * 0.9)),
    },
    createdAt: Date.now() - randInt(0, 7 * 24 * 60 * 60 * 1000),
  }
}

export function makeBlindBox(): RecommendableItem {
  const item = makeItem()
  item.isBlindBox = true
  return item
}

export function makePromoItem(): RecommendableItem {
  const cat = rand(Object.keys(CATALOGS) as Category[])
  const tpl = rand(CATALOGS[cat])
  const creator = rand(CREATORS)
  const exposure = randInt(100, 100000)

  const item = makeItem(cat)
  item.promoTopic = {
    category: cat,
    targetName: tpl.title,
    targetDesc: tpl.desc,
    rewardPool: rand([100, 200, 500, 1000]),
    promoterCount: randInt(5, 200),
    totalExposure: exposure,
    waveLevel: getWaveLevel(exposure),
    daysLeft: rand([3, 5, 7, 14]),
    createdBy: creator.name,
  }
  return item
}

/**
 * 生成一批内容，混合有机内容、盲盒、推广话题
 */
export function makeFeedBatch(count: number): RecommendableItem[] {
  const items: RecommendableItem[] = []
  for (let i = 0; i < count; i++) {
    const rand = Math.random()
    if (i % 10 === 5) {
      // 每10个里1个盲盒
      items.push(makeBlindBox())
    } else if (i % 5 === 3) {
      // 每5个里1个推广话题
      items.push(makePromoItem())
    } else {
      // 其余是有机内容，跨品类随机
      items.push(makeItem())
    }
  }
  return items
}
