// 중계 서버 역할을 흉내 낸 모듈.
// 실제 구축 시: 카페24 스킨의 위젯 JS → 중계 서버 API → (캐시 확인) → 외부 차량정보 API.
// 시안에서는 외부 API 응답을 가상 데이터로 대체하고, 캐시·응답시간 차이만 그대로 재현한다.
import { allTrims, findTrim, type Maker } from '../data/vehicles';

export type VehicleSpec = {
  key: string; // 차량번호 또는 차대번호
  type: 'plate' | 'vin';
  maker: string;
  model: string;
  code: string;
  year: number;
  trim: string;
  engine: string;
  fuel: string;
  cc: number;
  trimId: string;
};

export type CacheEntry = { spec: VehicleSpec; at: number; hits: number };
export type LogEntry = { key: string; type: 'plate' | 'vin'; at: number; cached: boolean; ms: number; ok: boolean };

export type LookupResult =
  | { ok: true; spec: VehicleSpec; cached: boolean; ms: number; matched: boolean }
  | { ok: false; error: string; ms: number };

export const PLATE_RE = /^\d{2,3}[가-힣]\d{4}$/;
export const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

export const SAMPLE_PLATES: { plate: string; trimId: string; year: number }[] = [
  { plate: '12가3456', trimId: 'avante-16g', year: 2022 },
  { plate: '345나6789', trimId: 'sorento-22d', year: 2021 },
  { plate: '68다1234', trimId: 'g80-25t', year: 2023 },
  { plate: '157라2468', trimId: 'spark-10g', year: 2019 },
  { plate: '23마9012', trimId: 'qm6-20lpe', year: 2020 },
];
export const SAMPLE_VINS: { vin: string; trimId: string; year: number }[] = [
  { vin: 'KMHL341ABNA123456', trimId: 'sonata-20g', year: 2022 },
  { vin: 'KNAPU81BDPK654321', trimId: 'sportage-16hev', year: 2023 },
];

export function normPlate(s: string): string {
  return s.replace(/\s/g, '');
}
export function normVin(s: string): string {
  return s.replace(/\s/g, '').toUpperCase();
}

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

/** "외부 차량정보 API"의 응답을 대신하는 가상 제원. 같은 번호는 항상 같은 차량이 나온다. */
function fakeExternalApi(seed: Maker[], key: string, type: 'plate' | 'vin'): VehicleSpec {
  const sample =
    type === 'plate' ? SAMPLE_PLATES.find((s) => s.plate === key) : SAMPLE_VINS.find((s) => s.vin === key);
  const list = allTrims(seed);
  let ref = sample ? findTrim(seed, sample.trimId) : null;
  let year = sample?.year ?? 0;
  if (!ref) {
    const h = hash(key);
    ref = list[h % list.length];
    year = ref.trim.from + ((h >>> 8) % (ref.trim.to - ref.trim.from + 1));
  }
  return {
    key,
    type,
    maker: ref.maker.name,
    model: ref.model.name,
    code: ref.model.code,
    year,
    trim: ref.trim.name,
    engine: ref.trim.engine,
    fuel: ref.trim.fuel,
    cc: ref.trim.cc,
    trimId: ref.trim.id,
  };
}

export type RelayDeps = {
  /** 외부 API 기준 데이터 (초기 차종 표) */
  seed: Maker[];
  /** 현재 차종 마스터 (관리자가 수정한 상태) */
  master: Maker[];
  getCache: (key: string) => CacheEntry | undefined;
  putCache: (key: string, spec: VehicleSpec) => void;
  log: (e: LogEntry) => void;
  wait?: (ms: number) => Promise<void>;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function lookup(raw: string, type: 'plate' | 'vin', deps: RelayDeps): Promise<LookupResult> {
  const wait = deps.wait ?? sleep;
  const key = type === 'plate' ? normPlate(raw) : normVin(raw);
  const valid = type === 'plate' ? PLATE_RE.test(key) : VIN_RE.test(key);
  if (!valid) {
    return {
      ok: false,
      ms: 0,
      error:
        type === 'plate'
          ? '차량번호 형식을 확인해 주세요. (예: 12가3456, 123가4567)'
          : '차대번호는 영문·숫자 17자리입니다. (I, O, Q 제외)',
    };
  }

  const hit = deps.getCache(key);
  let spec: VehicleSpec;
  let ms: number;
  if (hit) {
    ms = 40 + (hash(key) % 40);
    await wait(ms);
    spec = hit.spec;
  } else {
    ms = 780 + (hash(key) % 420);
    await wait(ms);
    spec = fakeExternalApi(deps.seed, key, type);
  }
  deps.putCache(key, spec);
  deps.log({ key, type, at: Date.now(), cached: !!hit, ms, ok: true });
  // 조회된 제원 코드를 자체 차종 마스터와 매칭
  const matched = !!findTrim(deps.master, spec.trimId);
  return { ok: true, spec, cached: !!hit, ms, matched };
}
