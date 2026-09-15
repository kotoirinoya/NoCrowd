import { PrismaClient } from '@prisma/client'
import { randomBytes, scryptSync } from 'node:crypto'

const prisma = new PrismaClient()

// ローカル検証用の店舗スタッフ初期パスワード。実運用前に必ず変更すること。
const DEV_STAFF_PASSWORD = 'password123'

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

interface ShopSeed {
  slug: string
  name: string
  address: string
  lat: number
  lng: number
  isChain: boolean
  hasWifi: boolean
  hasPower: boolean
  smokingStatus: 'NON_SMOKING' | 'SMOKING' | 'SEPARATED'
  photos: string[]
  menuPhotos?: string[]
  menuItems: string[]
  description: string
  totalSeats: number
  availableSeats: number
  congestionLevel: 'UNKNOWN' | 'EMPTY' | 'MODERATE' | 'FULL'
}

// 三宮エリアを想定したサンプル店舗。緯度経度はおおよその値。
const SHOPS: ShopSeed[] = [
  {
    slug: 'starbucks-sannomiya',
    name: 'スターバックス 三宮北野坂店',
    address: '兵庫県神戸市中央区北長狭通1丁目',
    lat: 34.6952,
    lng: 135.1955,
    isChain: true,
    hasWifi: true,
    hasPower: true,
    smokingStatus: 'NON_SMOKING' as const,
    photos: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
      'https://images.unsplash.com/photo-1453614512568-c4024d13c247',
    ],
    menuPhotos: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085'],
    menuItems: ['カフェラテ', 'ドリップコーヒー', 'フラペチーノ', 'チーズケーキ'],
    description: '窓際に電源席が多く、テスト期間は開店直後が狙い目。',
    totalSeats: 20,
    availableSeats: 6,
    congestionLevel: 'MODERATE' as const,
  },
  {
    slug: 'doutor-sannomiya',
    name: 'ドトールコーヒー 三宮センター街店',
    address: '兵庫県神戸市中央区三宮町1丁目',
    lat: 34.6935,
    lng: 135.1927,
    isChain: true,
    hasWifi: true,
    hasPower: false,
    smokingStatus: 'SEPARATED' as const,
    photos: ['https://images.unsplash.com/photo-1445116572660-236099ec97a0'],
    menuItems: ['ブレンドコーヒー', 'ミラノサンド', 'カフェオレ'],
    description: '禁煙席と喫煙席が分かれている。長時間滞在OK。',
    totalSeats: 15,
    availableSeats: 15,
    congestionLevel: 'EMPTY' as const,
  },
  {
    slug: 'saizeriya-sannomiya',
    name: 'サイゼリヤ 三宮店',
    address: '兵庫県神戸市中央区磯上通',
    lat: 34.6969,
    lng: 135.1975,
    isChain: true,
    hasWifi: false,
    hasPower: false,
    smokingStatus: 'NON_SMOKING' as const,
    photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0'],
    menuItems: ['ミラノ風ドリア', 'ペペロンチーノ', 'ドリンクバー'],
    description: '安価に長居しやすいが電源・Wi-Fiはなし。',
    totalSeats: 40,
    availableSeats: 12,
    congestionLevel: 'MODERATE' as const,
  },
  {
    slug: 'local-cafe-kitano',
    name: 'カフェ・キタノザカ（個人店）',
    address: '兵庫県神戸市中央区山本通',
    lat: 34.6989,
    lng: 135.1943,
    isChain: false,
    hasWifi: true,
    hasPower: true,
    smokingStatus: 'NON_SMOKING' as const,
    photos: ['https://images.unsplash.com/photo-1521017432531-fbd92d768814'],
    menuItems: ['自家焙煎コーヒー', '手作りチーズケーキ'],
    description: '静かな個人店。長時間の勉強利用歓迎。',
    totalSeats: 10,
    availableSeats: 3,
    congestionLevel: 'FULL' as const,
  },
  {
    slug: 'gongcha-sannomiya',
    name: 'ゴンチャ 三宮店',
    address: '兵庫県神戸市中央区三宮町2丁目',
    lat: 34.6946,
    lng: 135.1938,
    isChain: true,
    hasWifi: false,
    hasPower: false,
    smokingStatus: 'NON_SMOKING' as const,
    photos: ['https://images.unsplash.com/photo-1558857563-b371033873b8'],
    menuItems: ['ミルクティー', 'タピオカ', 'チーズフォーム烏龍茶'],
    description: 'テイクアウト中心。短時間の休憩向け。',
    totalSeats: 8,
    availableSeats: 8,
    congestionLevel: 'EMPTY' as const,
  },
]

// 再実行しても同じ結果になるよう決定的な乱数生成器を使う
function mulberry32(seed: number) {
  return function random() {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260915)

const KOBE_CENTER = { lat: 34.6952, lng: 135.1955 }
const SPREAD_DEG = 0.035 // 三宮を中心に半径約3〜4kmに散らす

const STOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
  'https://images.unsplash.com/photo-1453614512568-c4024d13c247',
  'https://images.unsplash.com/photo-1445116572660-236099ec97a0',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814',
  'https://images.unsplash.com/photo-1558857563-b371033873b8',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
  'https://images.unsplash.com/photo-1559925393-8be0ec4767c8',
]

interface BrandTemplate {
  name: string
  isChain: boolean
  hasWifi: boolean
  hasPower: boolean
  smokingStatus: 'NON_SMOKING' | 'SMOKING' | 'SEPARATED'
  menuItems: string[]
  description: string
}

const BRANDS: BrandTemplate[] = [
  { name: 'タリーズコーヒー', isChain: true, hasWifi: true, hasPower: true, smokingStatus: 'NON_SMOKING', menuItems: ['タリーズラテ', 'ホットドッグ'], description: '駅近で使いやすい。' },
  { name: 'コメダ珈琲店', isChain: true, hasWifi: true, hasPower: false, smokingStatus: 'SEPARATED', menuItems: ['シロノワール', 'たっぷりアイスコーヒー'], description: 'ソファ席が広めでゆったり。' },
  { name: 'エクセルシオールカフェ', isChain: true, hasWifi: true, hasPower: true, smokingStatus: 'NON_SMOKING', menuItems: ['カフェモカ', 'ベーグルサンド'], description: '窓際カウンター席が人気。' },
  { name: 'カフェ・ベローチェ', isChain: true, hasWifi: true, hasPower: true, smokingStatus: 'SEPARATED', menuItems: ['Vドリップコーヒー', 'イタリアンスパゲッティ'], description: '価格が安く長居しやすい。' },
  { name: '上島珈琲店', isChain: true, hasWifi: false, hasPower: false, smokingStatus: 'SEPARATED', menuItems: ['アイスカフェオーレ', 'ナポリタン'], description: '落ち着いた喫茶店の雰囲気。' },
  { name: 'サンマルクカフェ', isChain: true, hasWifi: true, hasPower: false, smokingStatus: 'NON_SMOKING', menuItems: ['チョコクロ', 'ミラノサンド'], description: '焼きたてチョコクロが名物。' },
  { name: '星乃珈琲店', isChain: true, hasWifi: false, hasPower: false, smokingStatus: 'NON_SMOKING', menuItems: ['自家焙煎コーヒー', 'ふわふわパンケーキ'], description: '一人でも入りやすい個室風の席あり。' },
  { name: '喫茶室ルノアール', isChain: true, hasWifi: true, hasPower: true, smokingStatus: 'SEPARATED', menuItems: ['ブレンドコーヒー', 'ミックスサンド'], description: '静かで商談や勉強にも人気。' },
  { name: 'プロント', isChain: true, hasWifi: true, hasPower: false, smokingStatus: 'NON_SMOKING', menuItems: ['カフェラテ', 'ミートソースパスタ'], description: '夜はバーになる二毛作カフェ。' },
  { name: '珈琲館', isChain: true, hasWifi: false, hasPower: false, smokingStatus: 'SEPARATED', menuItems: ['サイフォンコーヒー', 'モーニングセット'], description: '本格サイフォンコーヒーが自慢。' },
  { name: 'ミスタードーナツ', isChain: true, hasWifi: false, hasPower: false, smokingStatus: 'NON_SMOKING', menuItems: ['ポン・デ・リング', 'カフェオレ'], description: 'ドーナツ食べ放題の時間帯が狙い目。' },
  { name: 'ドトールコーヒー', isChain: true, hasWifi: true, hasPower: false, smokingStatus: 'SEPARATED', menuItems: ['ブレンドコーヒー', 'ミラノサンド'], description: '駅前に多く便利。' },
  { name: 'スターバックス', isChain: true, hasWifi: true, hasPower: true, smokingStatus: 'NON_SMOKING', menuItems: ['カフェラテ', 'フラペチーノ'], description: '電源席が多めで作業しやすい。' },
  { name: 'ゴンチャ', isChain: true, hasWifi: false, hasPower: false, smokingStatus: 'NON_SMOKING', menuItems: ['ミルクティー', 'タピオカ'], description: 'テイクアウト中心。' },
]

const AREA_NAMES = [
  '三宮北口', '三宮南口', '三宮東口', '三宮中央', 'センター街',
  '北野坂', '元町通', '磯上通', '国際会館前', '花時計前',
  'サンキタ通', 'フラワーロード', '生田新道', '下山手通', '御幸通',
]

function shuffledPairs(): { brand: BrandTemplate; area: string }[] {
  const pairs: { brand: BrandTemplate; area: string }[] = []
  for (const brand of BRANDS) {
    for (const area of AREA_NAMES) {
      pairs.push({ brand, area })
    }
  }
  for (let i = pairs.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

const GENERATED_COUNT = 95
const usedSlugs = new Set(SHOPS.map((s) => s.slug))
let generated = 0
for (const { brand, area } of shuffledPairs()) {
  if (generated >= GENERATED_COUNT) break
  const slug = `${brand.name}-${area}`
    .toLowerCase()
    .replace(/[^a-z0-9ぁ-んァ-ヶー一-龠]/gi, '')
  if (usedSlugs.has(slug)) continue
  usedSlugs.add(slug)

  const totalSeats = 8 + Math.floor(rand() * 33)
  const availableSeats = Math.floor(rand() * (totalSeats + 1))
  const ratio = availableSeats / totalSeats
  const congestionLevel = ratio > 0.5 ? ('EMPTY' as const) : ratio > 0.15 ? ('MODERATE' as const) : ('FULL' as const)

  SHOPS.push({
    slug,
    name: `${brand.name} ${area}店`,
    address: `兵庫県神戸市中央区${area}付近`,
    lat: KOBE_CENTER.lat + (rand() - 0.5) * SPREAD_DEG * 2,
    lng: KOBE_CENTER.lng + (rand() - 0.5) * SPREAD_DEG * 2,
    isChain: brand.isChain,
    hasWifi: brand.hasWifi,
    hasPower: brand.hasPower,
    smokingStatus: brand.smokingStatus,
    photos: [STOCK_PHOTOS[generated % STOCK_PHOTOS.length]],
    menuItems: brand.menuItems,
    description: brand.description,
    totalSeats,
    availableSeats,
    congestionLevel,
  })
  generated += 1
}

async function main() {
  for (const s of SHOPS) {
    const fields = {
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      isChain: s.isChain,
      hasWifi: s.hasWifi,
      hasPower: s.hasPower,
      smokingStatus: s.smokingStatus,
      photos: s.photos,
      menuPhotos: 'menuPhotos' in s ? s.menuPhotos : [],
      menuItems: 'menuItems' in s ? s.menuItems : [],
      description: s.description,
      totalSeats: s.totalSeats,
      availableSeats: s.availableSeats,
      congestionLevel: s.congestionLevel,
      congestionUpdatedAt: new Date(),
    }
    const shop = await prisma.shop.upsert({
      where: { id: s.slug },
      update: fields,
      create: { id: s.slug, ...fields },
    })

    const staffUsername = `${s.slug}-staff`
    await prisma.shopStaff.upsert({
      where: { username: staffUsername },
      update: {},
      create: {
        username: staffUsername,
        passwordHash: hashPassword(DEV_STAFF_PASSWORD),
        shopId: shop.id,
      },
    })
  }

  console.log('Seed完了。店舗スタッフの初期パスワードは prisma/seed.ts の DEV_STAFF_PASSWORD を参照してください。')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
