// 부품 예시 데이터. "호환 그룹"(같은 순정 품번을 쓰는 차종 묶음)마다
// 순정 1종 + 애프터마켓 대체품 2종을 만들어 약 400여 개 상품을 구성한다.
// 품번·가격·브랜드는 모두 시연용 가상 값이다.
import { seedMakers } from './vehicles';

export type CatId = 'pad' | 'disc' | 'oilf' | 'airf' | 'cabin' | 'wiper' | 'plug' | 'shock' | 'batt' | 'oil';

export const CATS: { id: CatId; name: string; desc: string }[] = [
  { id: 'pad', name: '브레이크 패드', desc: '프론트 패드 세트' },
  { id: 'disc', name: '브레이크 디스크', desc: '프론트 디스크 로터' },
  { id: 'oilf', name: '오일 필터', desc: '엔진오일 필터' },
  { id: 'airf', name: '에어 필터', desc: '엔진 흡기 필터' },
  { id: 'cabin', name: '에어컨 필터', desc: '실내 공기 필터' },
  { id: 'wiper', name: '와이퍼', desc: '운전석·조수석 세트' },
  { id: 'plug', name: '점화플러그', desc: '이리듐 플러그' },
  { id: 'shock', name: '쇼크업소버', desc: '프론트 쇼크업소버' },
  { id: 'batt', name: '배터리', desc: '시동용 배터리' },
  { id: 'oil', name: '엔진오일', desc: '합성 엔진오일' },
];

export const catName = (id: CatId) => CATS.find((c) => c.id === id)!.name;

export type Part = {
  id: string;
  cafe24No: number; // 카페24 상품번호 (연동 키)
  sku: string; // 자체 품번
  name: string;
  brand: string;
  kind: '순정' | '애프터마켓';
  cat: CatId;
  price: number;
  oem: string[]; // 순정 품번(OEM) — 교차 검색 기준
  fitNote: string;
  spec: [string, string][];
};

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}
const ALNUM = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
function code(seed: string, len: number, digitsOnly = false): string {
  let h = hash(seed);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += digitsOnly ? String(h % 10) : ALNUM[h % ALNUM.length];
    h = Math.floor(h / 7) + hash(seed + i);
  }
  return out;
}

const OEM_PREFIX: Record<CatId, string> = {
  pad: '58101',
  disc: '51712',
  oilf: '26300',
  airf: '28113',
  cabin: '97133',
  wiper: '98350',
  plug: '18846',
  shock: '54651',
  batt: '37110',
  oil: '05100',
};

function oemNo(makerId: string, cat: CatId, seed: string): string {
  if (makerId === 'chevrolet') return code(seed, 8, true);
  if (makerId === 'renault') return `${code(seed, 5, true)}${code(seed + 'r', 4, true)}R`;
  if (makerId === 'kgm') return code(seed, 10, true);
  return `${OEM_PREFIX[cat]}-${code(seed, 5)}`;
}

const BASE_PRICE: Record<CatId, number> = {
  pad: 62000,
  disc: 88000,
  oilf: 9800,
  airf: 16500,
  cabin: 14000,
  wiper: 26000,
  plug: 52000,
  shock: 118000,
  batt: 132000,
  oil: 43000,
};

const AFTER_BRANDS: Record<CatId, [string, string]> = {
  pad: ['카본텍', '한성브레이크'],
  disc: ['한성브레이크', '에이스파츠'],
  oilf: ['필터원', '에이스파츠'],
  airf: ['필터원', '블루웨이'],
  cabin: ['블루웨이', '필터원'],
  wiper: ['클리어뷰', '에이스파츠'],
  plug: ['스파크라인', '에이스파츠'],
  shock: ['라이드온', '에이스파츠'],
  batt: ['파워셀', '에이스파츠'],
  oil: ['루브맥스', '에이스파츠'],
};

type Group = { id: string; cat: CatId; label: string; makerId: string; makerName: string; fits: string[]; spec: [string, string][] };

// 차체 계열(브레이크·와이퍼·에어컨필터·쇼크업소버)은 플랫폼 단위로 공용
const CHASSIS: [label: string, models: string[]][] = [
  ['아반떼(CN7)', ['avante']],
  ['쏘나타(DN8)·K5(DL3)', ['sonata', 'k5']],
  ['그랜저(IG)', ['grandeur']],
  ['싼타페(TM)·쏘렌토(MQ4)', ['santafe', 'sorento']],
  ['투싼(NX4)·스포티지(NQ5)', ['tucson', 'sportage']],
  ['모닝(JA)', ['morning']],
  ['카니발(KA4)', ['carnival']],
  ['G80(RG3)', ['g80']],
  ['GV70(JK1)', ['gv70']],
  ['스파크(M400)', ['spark']],
  ['말리부', ['malibu']],
  ['트레일블레이저', ['trailblazer']],
  ['QM6', ['qm6']],
  ['SM6', ['sm6']],
  ['티볼리', ['tivoli']],
  ['토레스', ['torres']],
];

// 엔진 계열(오일필터·에어필터·점화플러그)은 엔진 단위로 공용
const ENGINE: [label: string, trims: string[], diesel?: boolean][] = [
  ['1.6 가솔린/LPi (아반떼)', ['avante-16g', 'avante-16lpi']],
  ['1.6 하이브리드 (아반떼)', ['avante-16hev']],
  ['2.0 가솔린/LPi (쏘나타·K5)', ['sonata-20g', 'sonata-20lpi', 'k5-20g', 'k5-20lpi']],
  ['1.6 터보 (쏘나타·K5·투싼·스포티지)', ['sonata-16t', 'k5-16t', 'tucson-16t', 'sportage-16t']],
  ['2.0 하이브리드 (쏘나타·K5)', ['sonata-20hev', 'k5-20hev']],
  ['2.4/2.5 가솔린 (그랜저)', ['grandeur-24g', 'grandeur-25g', 'grandeur-24hev']],
  ['3.3 가솔린 (그랜저)', ['grandeur-33g']],
  ['2.2 디젤 (싼타페·쏘렌토·카니발)', ['santafe-22d', 'sorento-22d', 'carnival-22d'], true],
  ['2.5 터보 (싼타페·쏘렌토)', ['santafe-25t', 'sorento-25t']],
  ['1.6 터보 하이브리드 (SUV)', ['santafe-16hev', 'sorento-16hev', 'tucson-16hev', 'sportage-16hev']],
  ['2.0 디젤 (투싼·스포티지)', ['tucson-20d', 'sportage-20d'], true],
  ['1.0 가솔린 (모닝)', ['morning-10g']],
  ['3.5 가솔린 (카니발)', ['carnival-35g']],
  ['2.5 터보 (G80·GV70)', ['g80-25t', 'gv70-25t']],
  ['3.5 터보 (G80·GV70)', ['g80-35t', 'gv70-35t']],
  ['2.2 디젤 (G80·GV70)', ['g80-22d', 'gv70-22d'], true],
  ['1.0 가솔린 (스파크)', ['spark-10g']],
  ['1.35/1.5 터보 (말리부·트레일블레이저)', ['malibu-15t', 'malibu-135t', 'trailblazer-135t']],
  ['2.0 터보 (말리부)', ['malibu-20t']],
  ['1.2 터보 (트레일블레이저)', ['trailblazer-12t']],
  ['2.0 가솔린/LPe (QM6·SM6)', ['qm6-20g', 'qm6-20lpe', 'sm6-20g']],
  ['1.3 터보 (SM6)', ['sm6-13t']],
  ['1.5 터보 (티볼리·토레스)', ['tivoli-15t', 'torres-15t']],
  ['1.6 디젤 (티볼리)', ['tivoli-16d'], true],
];

const CAT_SPEC: Record<CatId, [string, string][]> = {
  pad: [['위치', '프론트(앞)'], ['구성', '좌우 1세트 (4매)'], ['마찰재', '저분진 세라믹']],
  disc: [['위치', '프론트(앞)'], ['구성', '1개'], ['형식', '벤틸레이티드']],
  oilf: [['형식', '카트리지/스핀온'], ['교환 주기', '엔진오일 교환 시']],
  airf: [['여과재', '부직포 다층'], ['교환 주기', '약 1만 km']],
  cabin: [['여과 등급', 'PM2.5 활성탄'], ['교환 주기', '약 6개월']],
  wiper: [['구성', '운전석 + 조수석'], ['형식', '플랫 블레이드']],
  plug: [['구성', '1대분 세트'], ['전극', '이리듐']],
  shock: [['위치', '프론트(앞)'], ['구성', '1개'], ['형식', '가스식']],
  batt: [['보증', '12개월'], ['단자', '표준(L)']],
  oil: [['용량', '4L'], ['기유', '100% 합성유']],
};

function buildGroups(): Group[] {
  const makers = seedMakers();
  const makerOfModel = new Map<string, { id: string; name: string }>();
  const trimsOfModel = new Map<string, string[]>();
  const fuelOf = new Map<string, string>();
  for (const mk of makers)
    for (const m of mk.models) {
      makerOfModel.set(m.id, { id: mk.id, name: mk.name });
      trimsOfModel.set(m.id, m.trims.map((t) => t.id));
      for (const t of m.trims) fuelOf.set(t.id, t.fuel);
    }
  const groups: Group[] = [];
  const push = (cat: CatId, label: string, fits: string[], extra: [string, string][] = []) => {
    const mk = makerOfModel.get(fits[0].split('-')[0])!;
    groups.push({
      id: `${cat}-${groups.length}`,
      cat,
      label,
      makerId: mk.id,
      makerName: mk.name,
      fits,
      spec: [...CAT_SPEC[cat], ...extra],
    });
  };

  for (const [label, models] of CHASSIS) {
    const fits = models.flatMap((m) => trimsOfModel.get(m)!);
    for (const cat of ['pad', 'disc', 'cabin', 'wiper', 'shock'] as CatId[]) push(cat, label, fits);
  }
  for (const [label, trims, diesel] of ENGINE) {
    push('oilf', label, trims);
    push('airf', label, trims);
    if (!diesel) push('plug', label, trims);
  }

  const all = [...fuelOf.keys()];
  const small = ['avante', 'morning', 'spark', 'trailblazer', 'tivoli'];
  const isHev = (t: string) => fuelOf.get(t) === '하이브리드';
  const isDiesel = (t: string) => fuelOf.get(t) === '디젤';
  const isSmall = (t: string) => small.includes(t.split('-')[0]);
  push('batt', '60Ah (소형·준중형)', all.filter((t) => isSmall(t) && !isHev(t) && !isDiesel(t)), [['용량', '60Ah'], ['형식', 'MF']]);
  push('batt', '80Ah (중형·SUV 가솔린/LPG)', all.filter((t) => !isSmall(t) && !isHev(t) && !isDiesel(t)), [['용량', '80Ah'], ['형식', 'MF']]);
  push('batt', '90Ah (디젤)', all.filter(isDiesel), [['용량', '90Ah'], ['형식', 'MF']]);
  push('batt', 'AGM 70Ah (하이브리드 보조)', all.filter(isHev), [['용량', '70Ah'], ['형식', 'AGM']]);
  push('oil', '0W-20 (가솔린·하이브리드)', all.filter((t) => fuelOf.get(t) === '가솔린' || isHev(t)), [['점도', '0W-20'], ['규격', 'API SP']]);
  push('oil', '5W-30 (LPG)', all.filter((t) => fuelOf.get(t) === 'LPG'), [['점도', '5W-30'], ['규격', 'API SP']]);
  push('oil', '5W-30 C3 (디젤 DPF)', all.filter(isDiesel), [['점도', '5W-30'], ['규격', 'ACEA C3']]);
  return groups;
}

export type Catalog = { parts: Part[]; fits: Record<string, string[]> };

export function seedCatalog(): Catalog {
  const parts: Part[] = [];
  const fits: Record<string, string[]> = {};
  let no = 1001;
  for (const g of buildGroups()) {
    const main = oemNo(g.makerId, g.cat, g.id);
    // 일부 그룹은 품번 변경(구품번)이 있어 순정 번호가 2개
    const oem = hash(g.id) % 3 === 0 ? [main, oemNo(g.makerId, g.cat, g.id + 'old')] : [main];
    const base = BASE_PRICE[g.cat] * (0.85 + (hash(g.id) % 40) / 100);
    const variants: { brand: string; kind: Part['kind']; mul: number }[] = [
      { brand: `${g.makerName} 순정`, kind: '순정', mul: 1 },
      { brand: AFTER_BRANDS[g.cat][0], kind: '애프터마켓', mul: 0.74 },
      { brand: AFTER_BRANDS[g.cat][1], kind: '애프터마켓', mul: 0.58 },
    ];
    variants.forEach((v, i) => {
      const id = `p${no}`;
      parts.push({
        id,
        cafe24No: no,
        sku: v.kind === '순정' ? main : `${v.brand === '에이스파츠' ? 'AP' : 'PF'}-${g.cat.toUpperCase()}-${code(g.id + i, 4, true)}`,
        name: `${v.brand} ${catName(g.cat)} · ${g.label}`,
        brand: v.brand,
        kind: v.kind,
        cat: g.cat,
        price: Math.round((base * v.mul) / 100) * 100,
        oem,
        fitNote: g.label,
        spec: g.spec,
      });
      fits[id] = [...g.fits];
      no++;
    });
  }
  return { parts, fits };
}

export const PARTS: Part[] = seedCatalog().parts;
export const PART_BY_ID = new Map(PARTS.map((p) => [p.id, p]));
