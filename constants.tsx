import { Column, Customer, CustomerStatus, ConstructionPhase, Task, Employee, AvatarConfig, TemplateTask, CompanyInfo } from './types';
import { Users, HardHat, FileText, PenTool, CheckCircle, Home } from 'lucide-react';

export const INITIAL_COLUMNS: Column[] = [
  { id: 'location', title: '建築地', type: 'text', order: 0, removable: false },
  { id: 'sales_rep', title: '営業担当', type: 'person', order: 1, removable: false },
  { id: 'architect', title: '設計担当', type: 'person', order: 2, removable: false },
  { id: 'ic', title: 'IC担当', type: 'person', order: 3, removable: false },
  { id: 'drawing_rep', title: '図面担当', type: 'person', order: 4, removable: false },
  { id: 'application_rep', title: '申請担当', type: 'person', order: 5, removable: false },
  { id: 'construction_rep', title: '工事担当', type: 'person', order: 6, removable: false },
  { id: 'constructor', title: '工事会社', type: 'select', options: ['広島建設', '瀬戸内工務店', '宮島ホーム', 'もみじ住宅建設'], order: 7, removable: false },
  { id: 'contract_date', title: '契約日', type: 'date', order: 8, removable: false },
  { id: 'amount', title: '請負金額', type: 'currency', order: 9, removable: false },
  { id: 'phone', title: '電話番号', type: 'phone', order: 10, removable: true },
];

export const INITIAL_TEMPLATE_TASKS: TemplateTask[] = [
  { id: 'tt1', category: '営業', title: '初回ヒアリング', isMilestone: false },
  { id: 'tt2', category: '営業', title: '資金計画の提示', isMilestone: false },
  { id: 'tt3', category: '営業', title: '敷地調査', isMilestone: false },
  { id: 'tt4', category: '営業', title: '工事請負契約', isMilestone: true },
  { id: 'tt5', category: '設計', title: 'プラン確定', isMilestone: true },
  { id: 'tt6', category: '設計', title: '仕様打ち合わせ開始', isMilestone: false },
  { id: 'tt7', category: '申請', title: '確認申請提出', isMilestone: false },
  { id: 'tt8', category: '工務', title: '地鎮祭', isMilestone: false },
  { id: 'tt9', category: '工務', title: '着工', isMilestone: true },
];

export const INITIAL_COMPANY_INFO: Omit<CompanyInfo, 'id'> = {
    name: 'ie-koto MINDホーム株式会社',
    branch: '東京本社',
    address: '東京都港区...',
    phone: '03-1234-5678'
};


// Expanded Color Configuration for UI consistency
export const STATUS_CONFIG: Record<CustomerStatus, { 
    badge: string; 
    row: string; 
    header: string;
    border: string;
    text: string;
    bg: string;
}> = {
  [CustomerStatus.NEGOTIATION]: {
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    row: 'bg-blue-50 hover:bg-blue-100/80',
    header: 'bg-blue-600 text-white',
    border: 'border-blue-500',
    text: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  [CustomerStatus.APPLIED]: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    row: 'bg-red-50 hover:bg-red-100/80',
    header: 'bg-red-600 text-white',
    border: 'border-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50'
  },
  [CustomerStatus.BASIC_DESIGN]: {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    row: 'bg-orange-50 hover:bg-orange-100/80',
    header: 'bg-orange-500 text-white',
    border: 'border-orange-500',
    text: 'text-orange-600',
    bg: 'bg-orange-50'
  },
  [CustomerStatus.SPEC_MEETING]: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    row: 'bg-green-50 hover:bg-green-100/80',
    header: 'bg-green-600 text-white',
    border: 'border-green-500',
    text: 'text-green-600',
    bg: 'bg-green-50'
  },
  [CustomerStatus.CONSTRUCTION_PREP]: {
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    row: 'bg-indigo-50 hover:bg-indigo-100/80',
    header: 'bg-indigo-600 text-white',
    border: 'border-indigo-500',
    text: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  [CustomerStatus.CONSTRUCTION]: {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    row: 'bg-yellow-50 hover:bg-yellow-100/80',
    header: 'bg-yellow-500 text-white',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    bg: 'bg-yellow-50'
  },
  [CustomerStatus.RESIDENT]: {
    badge: 'bg-stone-100 text-stone-800 border-stone-200',
    row: 'bg-stone-50 hover:bg-stone-100/80',
    header: 'bg-stone-600 text-white',
    border: 'border-stone-500',
    text: 'text-stone-600',
    bg: 'bg-stone-50'
  },
};

// Kept for backward compatibility if needed, but mapped to new config
export const STATUS_COLORS: Record<CustomerStatus, string> = {
  [CustomerStatus.NEGOTIATION]: STATUS_CONFIG[CustomerStatus.NEGOTIATION].badge,
  [CustomerStatus.APPLIED]: STATUS_CONFIG[CustomerStatus.APPLIED].badge,
  [CustomerStatus.BASIC_DESIGN]: STATUS_CONFIG[CustomerStatus.BASIC_DESIGN].badge,
  [CustomerStatus.SPEC_MEETING]: STATUS_CONFIG[CustomerStatus.SPEC_MEETING].badge,
  [CustomerStatus.CONSTRUCTION_PREP]: STATUS_CONFIG[CustomerStatus.CONSTRUCTION_PREP].badge,
  [CustomerStatus.CONSTRUCTION]: STATUS_CONFIG[CustomerStatus.CONSTRUCTION].badge,
  [CustomerStatus.RESIDENT]: STATUS_CONFIG[CustomerStatus.RESIDENT].badge,
};

export const PHASE_ICONS: Record<ConstructionPhase, any> = {
  [ConstructionPhase.PRE_CONSTRUCTION]: FileText,
  [ConstructionPhase.FOUNDATION]: HardHat,
  [ConstructionPhase.FRAMING]: Home,
  [ConstructionPhase.CARPENTRY]: PenTool,
  [ConstructionPhase.SCAFFOLDING_REMOVAL]: CheckCircle,
  [ConstructionPhase.EXTERIOR]: Users,
};

// Configuration for Gantt Chart colors and default durations
export const CONSTRUCTION_PHASE_CONFIG: Record<ConstructionPhase, { name: string, color: string, defaultDuration: number }> = {
    [ConstructionPhase.PRE_CONSTRUCTION]: { name: '着工前', color: '#94a3b8', defaultDuration: 0 },
    [ConstructionPhase.FOUNDATION]: { name: '基礎工事', color: '#3b82f6', defaultDuration: 21 },
    [ConstructionPhase.FRAMING]: { name: '上棟', color: '#ef4444', defaultDuration: 2 },
    [ConstructionPhase.CARPENTRY]: { name: '大工工事', color: '#f59e0b', defaultDuration: 40 },
    [ConstructionPhase.SCAFFOLDING_REMOVAL]: { name: '足場解体', color: '#10b981', defaultDuration: 10 },
    [ConstructionPhase.EXTERIOR]: { name: '外構工事', color: '#8b5cf6', defaultDuration: 15 },
};

// --- Sample Data Generation ---

const SURNAMES = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水', '山崎', '森', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川'];
const GIVEN_NAMES = ['健太', '美咲', '一郎', '花子', '大輔', '結衣', '翔太', '愛', '拓也', '美優', '直人', '菜摘', '亮太', '未来', '達也', '彩', '和也', '遥', '哲也', '優子', '浩太', '真央', '慎吾', '千尋', '剛', '亜美', '健二', '里奈', '太一', '恵'];

// Expanded Staff Lists (Total ~30)
export const SALES_REPS = [
  '田中 健太', '山本 美咲', '鈴木 一郎', '佐藤 花子', '高橋 大輔', 
  '伊藤 結衣', '渡辺 翔太', '中村 愛', '小林 拓也', '加藤 美優'
];
export const ARCHITECTS = [
  '吉田 直人', '山田 菜摘', '佐々木 亮太', '山口 未来', '松本 達也', 
  '井上 彩', '木村 和也', '林 遥', '斎藤 哲也', '清水 優子'
];
export const ICS = [
  '山崎 浩太', '森 真央', '池田 慎吾', '橋本 千尋', '阿部 剛', 
  '石川 亜美', '山下 健二', '中島 里奈', '石井 太一', '小川 恵'
];
export const CONSTRUCTION_REPS = [
  '渡辺 健二', '中村 里奈', '小林 太一', '加藤 恵', '吉田 浩太', 
  '山田 真央', '佐々木 慎吾', '山口 千尋', '松本 剛', '井上 亜美'
];
export const APPLICATION_REPS = [
  '木村 健二', '林 里奈', '斎藤 太一', '清水 恵'
];


// Helper to generate random avatar
const generateRandomAvatar = (): AvatarConfig => {
    const SKIN_COLORS = ['#fcece3', '#f5d0b0', '#eeb088', '#d68b60', '#8d5524'];
    const HAIR_COLORS = ['#1a1a1a', '#4a3022', '#8d5524', '#e6cea8', '#a8a8a8', '#b91c1c', '#e0ac69', '#f5e0c4'];
    const CLOTH_COLORS = [
        '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#000000', '#ffffff', 
        '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#0f766e', '#059669', '#10b981', 
        '#b91c1c', '#ef4444', '#c2410c', '#f97316', '#a16207', '#eab308', '#7e22ce', 
        '#a855f7', '#be185d', '#ec4899'
    ];
    const STYLES = ['short', 'side', 'long', 'bob', 'bald', 'long_wavy', 'ponytail', 'bun'];
    const EYES = ['normal', 'smile', 'relaxed', 'serious', 'bored', 'wink', 'lashes', 'sparkle', 'wide', 'teary'];
    const MOUTHS = ['smile', 'big_smile', 'laugh', 'serious', 'surprised', 'frown', 'tongue', 'cat', 'smirk', 'whistle'];
    const CLOTHES = ['suit', 'tshirt', 'uniform', 'blouse'];
    const BEARDS = ['none', 'stubble', 'goatee', 'moustache', 'full'];
    const FACE_SHAPES = ['round', 'oval', 'square'];
    const EYEBROWS = ['normal', 'thick', 'thin', 'angry', 'troubled'];

    return {
        skinColor: SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)],
        faceShape: FACE_SHAPES[Math.floor(Math.random() * FACE_SHAPES.length)],
        hairStyle: STYLES[Math.floor(Math.random() * STYLES.length)],
        hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
        eyebrows: EYEBROWS[Math.floor(Math.random() * EYEBROWS.length)],
        eyeStyle: EYES[Math.floor(Math.random() * EYES.length)],
        mouthStyle: MOUTHS[Math.floor(Math.random() * MOUTHS.length)],
        clothing: CLOTHES[Math.floor(Math.random() * CLOTHES.length)],
        clothingColor: CLOTH_COLORS[Math.floor(Math.random() * CLOTH_COLORS.length)],
        glasses: Math.random() > 0.8 ? ['round', 'square'][Math.floor(Math.random() * 2)] : 'none',
        hat: Math.random() > 0.9 ? ['helmet_w', 'cap'][Math.floor(Math.random() * 2)] : 'none',
        beard: Math.random() > 0.8 ? BEARDS[Math.floor(Math.random() * BEARDS.length)] : 'none',
        accessory: 'none'
    };
};

// FIX: Add 'created_at' property to each employee object to satisfy the Employee interface.
export const INITIAL_EMPLOYEES: Employee[] = [
    ...SALES_REPS.map((name, i) => ({ id: `es_${i}`, name, role: '営業' as const, avatar: generateRandomAvatar(), created_at: new Date().toISOString() })),
    ...ARCHITECTS.map((name, i) => ({ id: `ea_${i}`, name, role: '設計' as const, avatar: generateRandomAvatar(), created_at: new Date().toISOString() })),
    ...ICS.map((name, i) => ({ id: `ei_${i}`, name, role: 'IC' as const, avatar: generateRandomAvatar(), created_at: new Date().toISOString() })),
    ...CONSTRUCTION_REPS.map((name, i) => ({ id: `ec_${i}`, name, role: '工務' as const, avatar: generateRandomAvatar(), created_at: new Date().toISOString() })),
    ...APPLICATION_REPS.map((name, i) => ({ id: `eapp_${i}`, name, role: 'その他' as const, avatar: generateRandomAvatar(), created_at: new Date().toISOString() })),
];

const CONSTRUCTORS = ['広島建設', '瀬戸内工務店', '宮島ホーム', 'もみじ住宅建設'];
const LOCATIONS = [
  '広島市中区八丁堀', '広島市中区基町', '広島市南区宇品', '広島市南区皆実町', 
  '広島市東区牛田', '広島市東区戸坂', '広島市西区横川', '広島市西区井口', 
  '広島市安佐南区祇園', '広島市安佐南区緑井', '広島市安佐北区可部', '広島市安芸区船越', 
  '広島市佐伯区五日市', '廿日市市宮内', '安芸郡府中町', '東広島市西条', '呉市中央'
];

// Center around Hiroshima City
export const CENTER_LAT = 34.3853;
export const CENTER_LNG = 132.4553;

const generateCustomers = (count: number): Customer[] => {
  const customers: Customer[] = [];
  const phases = Object.values(ConstructionPhase);

  for (let i = 0; i < count; i++) {
    // Distribute statuses roughly
    const status = i < 5 ? CustomerStatus.NEGOTIATION :
                   i < 8 ? CustomerStatus.APPLIED :
                   i < 13 ? CustomerStatus.BASIC_DESIGN :
                   i < 18 ? CustomerStatus.SPEC_MEETING :
                   i < 26 ? CustomerStatus.CONSTRUCTION :
                   CustomerStatus.RESIDENT;

    let currentPhase: ConstructionPhase | undefined = undefined;
    
    if (status === CustomerStatus.CONSTRUCTION) {
        // Random phase for construction customers
        // Bias towards later phases for higher index to mimic flow
        currentPhase = phases[Math.floor(Math.random() * phases.length)];
    } else if ([CustomerStatus.APPLIED, CustomerStatus.BASIC_DESIGN, CustomerStatus.SPEC_MEETING].includes(status)) {
        currentPhase = ConstructionPhase.PRE_CONSTRUCTION;
    }

    const surname = SURNAMES[i % SURNAMES.length];
    const name = `${surname} ${GIVEN_NAMES[i % GIVEN_NAMES.length]}`;
    
    // Spread locations around Hiroshima (approx 15km radius)
    const latOffset = (Math.random() - 0.5) * 0.15; 
    const lngOffset = (Math.random() - 0.5) * 0.15; 
    
    const lat = CENTER_LAT + latOffset;
    const lng = CENTER_LNG + lngOffset;
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 80 + 10;

    const sales = SALES_REPS[Math.floor(Math.random() * SALES_REPS.length)];
    const arch = status !== CustomerStatus.NEGOTIATION ? ARCHITECTS[Math.floor(Math.random() * ARCHITECTS.length)] : '-';
    const ic = [CustomerStatus.SPEC_MEETING, CustomerStatus.CONSTRUCTION, CustomerStatus.RESIDENT].includes(status) ? ICS[Math.floor(Math.random() * ICS.length)] : '-';
    const drawingRep = status !== CustomerStatus.NEGOTIATION ? ARCHITECTS[Math.floor(Math.random() * ARCHITECTS.length)] : '-';
    const appRep = status !== CustomerStatus.NEGOTIATION ? APPLICATION_REPS[Math.floor(Math.random() * APPLICATION_REPS.length)] : '-';
    const constRep = [CustomerStatus.CONSTRUCTION, CustomerStatus.RESIDENT].includes(status) ? CONSTRUCTION_REPS[Math.floor(Math.random() * CONSTRUCTION_REPS.length)] : '-';
    
    const amount = status === CustomerStatus.NEGOTIATION ? 0 : Math.floor(Math.random() * 3000 + 2500) * 10000; // 25M - 55M
    
    // Generate more realistic contract dates
    const today = new Date();
    let contractDateStr = '';
    if (status !== CustomerStatus.NEGOTIATION) {
        // For past projects, set dates in the last 1.5 years
        const randomDaysAgo = Math.floor(Math.random() * 500) + 30; 
        const contractDate = new Date(today.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
        contractDateStr = contractDate.toISOString().split('T')[0];
    }
    
    customers.push({
        id: `c_${i + 1}`,
        name: name,
        status: status,
        currentPhase: currentPhase,
        location: { x, y, lat, lng },
        data: {
            location: `${LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]} ${Math.floor(Math.random() * 5 + 1)}-${Math.floor(Math.random() * 20 + 1)}`,
            sales_rep: sales,
            architect: arch,
            ic: ic,
            drawing_rep: drawingRep,
            application_rep: appRep,
            construction_rep: constRep,
            constructor: status === CustomerStatus.CONSTRUCTION || status === CustomerStatus.RESIDENT ? CONSTRUCTORS[Math.floor(Math.random() * CONSTRUCTORS.length)] : '-',
            contract_date: contractDateStr,
            amount: amount,
            phone: `090-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`
        },
        // FIX: Add 'created_at' property to satisfy the Customer interface.
        created_at: new Date(Date.now() - i * 1000 * 60 * 60 * 24 * 10).toISOString() // Stagger creation dates
    });
  }
  return customers;
}

export const INITIAL_CUSTOMERS = generateCustomers(30);

// --- Task Generation (110 Samples) ---

const SALES_TASKS_SRC = [
  { title: '初回お問い合わせ対応', isMilestone: false },
  { title: 'モデルハウス案内', isMilestone: false },
  { title: '資金計画ヒアリング', isMilestone: false },
  { title: '土地要望ヒアリング', isMilestone: false },
  { title: '敷地調査実施', isMilestone: false },
  { title: '法役所調査', isMilestone: false },
  { title: 'ファーストプラン提示', isMilestone: true },
  { title: '概算見積り提示', isMilestone: false },
  { title: '住宅ローン事前審査申込', isMilestone: false },
  { title: '事前審査承認連絡', isMilestone: false },
  { title: '土地買付証明書提出', isMilestone: false },
  { title: '土地売買契約立ち会い', isMilestone: true },
  { title: '重要事項説明書読み合わせ', isMilestone: false },
  { title: '工事請負契約書作成', isMilestone: false },
  { title: '工事請負契約締結', isMilestone: true },
  { title: '手付金入金確認', isMilestone: false },
  { title: '住宅ローン本審査申込', isMilestone: false },
  { title: 'つなぎ融資手続き', isMilestone: false },
  { title: '火災保険提案', isMilestone: false },
  { title: '金銭消費貸借契約', isMilestone: true },
];

const DESIGN_TASKS_SRC = [
  { title: '設計ヒアリング（詳細）', isMilestone: false },
  { title: '平面図修正案提示', isMilestone: false },
  { title: '立面図・パース提示', isMilestone: false },
  { title: '配置図確定', isMilestone: false },
  { title: '平面図確定承認', isMilestone: true },
  { title: '構造計算依頼', isMilestone: false },
  { title: '耐震等級3証明書手配', isMilestone: false },
  { title: '断熱性能計算（UA値）', isMilestone: false },
  { title: '省エネ計算書作成', isMilestone: false },
  { title: '外観仕様決め（外壁・屋根）', isMilestone: false },
  { title: 'サッシ・玄関ドア仕様決め', isMilestone: false },
  { title: '内部建具仕様決め', isMilestone: false },
  { title: 'フローリング・床材選定', isMilestone: false },
  { title: 'キッチンショールーム同行', isMilestone: false },
  { title: 'ユニットバス・洗面詳細決定', isMilestone: false },
  { title: 'トイレ仕様決定', isMilestone: false },
  { title: '照明プランニング作成', isMilestone: false },
  { title: '電気配線図（コンセント）確認', isMilestone: false },
  { title: 'クロス（壁紙）コーディネート', isMilestone: false },
  { title: 'カーテン提案', isMilestone: false },
  { title: '造作家具図面作成', isMilestone: false },
  { title: '収納計画詳細打ち合わせ', isMilestone: false },
  { title: 'ニッチ・棚板位置確認', isMilestone: false },
  { title: '外構プランゾーニング提示', isMilestone: false },
  { title: '外構詳細図・見積り作成', isMilestone: false },
  { title: '地盤調査実施', isMilestone: false },
  { title: '地盤改良判定・見積り', isMilestone: false },
  { title: '変更見積り書作成', isMilestone: false },
  { title: '最終仕様承認（色決め完了）', isMilestone: true },
  { title: '変更契約締結', isMilestone: true },
];

const APP_TASKS_SRC = [
  { title: '建築確認申請図書作成', isMilestone: false },
  { title: '建築確認申請提出', isMilestone: true },
  { title: '消防同意手配', isMilestone: false },
  { title: '建築確認済証受領', isMilestone: true },
  { title: '長期優良住宅認定申請', isMilestone: false },
  { title: '低炭素住宅認定申請', isMilestone: false },
  { title: '道路使用許可申請', isMilestone: false },
  { title: '上下水道加入申請', isMilestone: false },
  { title: '浄化槽設置届出書', isMilestone: false },
  { title: 'フラット35適合証明申請', isMilestone: false },
];

const CONST_TASKS_SRC = [
  { title: '地鎮祭手配・実施', isMilestone: false },
  { title: '近隣挨拶回り', isMilestone: false },
  { title: '着工指針会議', isMilestone: false },
  { title: '遣り方（丁張り）', isMilestone: false },
  { title: '根切り・砕石敷き', isMilestone: false },
  { title: '防湿シート・捨てコン施工', isMilestone: false },
  { title: '基礎配筋工事', isMilestone: false },
  { title: '配筋検査（JIO等）', isMilestone: true },
  { title: '基礎ベースコンクリート打設', isMilestone: false },
  { title: '基礎立ち上がり打設', isMilestone: false },
  { title: '型枠養生・解体', isMilestone: false },
  { title: '基礎天端レベラー施工', isMilestone: false },
  { title: '基礎完成検査', isMilestone: true },
  { title: '土台敷き・大引施工', isMilestone: false },
  { title: '先行足場組み立て', isMilestone: false },
  { title: '構造材搬入', isMilestone: false },
  { title: '建て方（レッカー作業）', isMilestone: false },
  { title: '上棟（棟上げ）', isMilestone: true },
  { title: '上棟式・餅まき', isMilestone: false },
  { title: 'ルーフィング（防水紙）施工', isMilestone: false },
  { title: '屋根材施工', isMilestone: false },
  { title: '構造金物締め付け', isMilestone: false },
  { title: '中間検査（躯体検査）', isMilestone: true },
  { title: '防蟻処理施工', isMilestone: false },
  { title: 'サッシ・窓枠取り付け', isMilestone: false },
  { title: '透湿防水シート施工', isMilestone: false },
  { title: '外壁通気胴縁施工', isMilestone: false },
  { title: '断熱材充填施工', isMilestone: false },
  { title: '気密測定実施', isMilestone: false },
  { title: 'フローリング施工', isMilestone: false },
  { title: '階段架け', isMilestone: false },
  { title: 'プラスターボード張り', isMilestone: false },
  { title: '建具枠取り付け', isMilestone: false },
  { title: 'ユニットバス組み立て', isMilestone: false },
  { title: '外壁サイディング施工完了', isMilestone: false },
  { title: '雨樋・破風板施工', isMilestone: false },
  { title: 'コーキング処理', isMilestone: false },
  { title: '足場解体前検査', isMilestone: false },
  { title: '足場解体', isMilestone: true },
  { title: 'クロス下地パテ処理', isMilestone: false },
  { title: 'クロス貼り施工', isMilestone: false },
  { title: 'キッチン取り付け', isMilestone: false },
  { title: '洗面・トイレ・設備機器設置', isMilestone: false },
  { title: '照明器具・スイッチ設置', isMilestone: false },
  { title: '左官工事（玄関ポーチ等）', isMilestone: false },
  { title: '完了検査（役所・民間）', isMilestone: true },
  { title: '美装（ハウスクリーニング）', isMilestone: false },
  { title: '社内竣工検査', isMilestone: false },
  { title: '施主立会い検査', isMilestone: true },
  { title: '引き渡し・鍵の受領', isMilestone: true },
];

const generateInitialTasks = (customers: Customer[]): Task[] => {
  const tasks: Task[] = [];
  let taskIdCounter = 1;

  customers.forEach((customer, index) => {
    // Determine which tasks to assign based on customer status roughly
    const addTasks = (source: typeof SALES_TASKS_SRC, category: Task['category'], count: number) => {
       for (let i = 0; i < count; i++) {
         const template = source[Math.floor(Math.random() * source.length)];
         
         // Completion logic approximation
         let isCompleted = false;
         if (customer.status === CustomerStatus.RESIDENT) isCompleted = true;
         else if (category === '営業' && customer.status !== CustomerStatus.NEGOTIATION) isCompleted = Math.random() > 0.2;
         else if (category === '設計' && [CustomerStatus.CONSTRUCTION, CustomerStatus.SPEC_MEETING, CustomerStatus.RESIDENT].includes(customer.status)) isCompleted = Math.random() > 0.3;
         else if (category === '工務' && customer.status === CustomerStatus.CONSTRUCTION) isCompleted = Math.random() > 0.5;

         tasks.push({
           id: `t_${taskIdCounter++}`,
           customerId: customer.id,
           category: category,
           title: template.title,
           isMilestone: template.isMilestone,
           isCompleted: isCompleted,
           // FIX: Add 'created_at' property to satisfy the Task interface.
           created_at: new Date(Date.now() - taskIdCounter * 1000 * 60 * 5).toISOString() // Stagger creation dates
         });
       }
    };

    if (customer.status === CustomerStatus.NEGOTIATION) {
        addTasks(SALES_TASKS_SRC, '営業', 3);
    } else if (customer.status === CustomerStatus.APPLIED || customer.status === CustomerStatus.BASIC_DESIGN) {
        addTasks(SALES_TASKS_SRC, '営業', 1);
        addTasks(DESIGN_TASKS_SRC, '設計', 3);
        addTasks(APP_TASKS_SRC, '申請', 1);
    } else if (customer.status === CustomerStatus.SPEC_MEETING) {
        addTasks(DESIGN_TASKS_SRC, '設計', 4);
        addTasks(APP_TASKS_SRC, '申請', 1);
    } else if (customer.status === CustomerStatus.CONSTRUCTION) {
        addTasks(APP_TASKS_SRC, '申請', 1);
        addTasks(CONST_TASKS_SRC, '工務', 4);
    } else {
        // Resident
        addTasks(CONST_TASKS_SRC, '工務', 2);
    }
  });

  return tasks;
};

export const INITIAL_TASKS = generateInitialTasks(INITIAL_CUSTOMERS);