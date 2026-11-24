// 앱 상태 + localStorage 저장. 서버가 없는 시안이므로 관리자 수정 내용도 이 브라우저에만 저장된다.
import { useSyncExternalStore } from 'react';
import { seedCatalog } from './data/parts';
import { findTrim, seedMakers, type Fuel, type Maker, type TrimRef } from './data/vehicles';
import { buildIndex, type Fits } from './lib/fit';
import { lookup, type CacheEntry, type LogEntry, type LookupResult } from './lib/relay';

export type Car = { trimId: string; year: number; key?: string; via: 'plate' | 'vin' | 'manual' };

export type AppState = {
  v: 1;
  makers: Maker[];
  fits: Fits;
  car: Car | null;
  cart: Record<string, number>;
  cache: Record<string, CacheEntry>;
  log: LogEntry[];
};

const KEY = 'partsfit-demo';
const SEED = seedMakers();

function fresh(): AppState {
  return { v: 1, makers: seedMakers(), fits: seedCatalog().fits, car: null, cart: {}, cache: {}, log: [] };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s && s.v === 1 && Array.isArray(s.makers) && s.fits) return { ...fresh(), ...s };
    }
  } catch {
    /* 저장소를 못 쓰는 환경이면 기본값으로 시작 */
  }
  return fresh();
}

let state = load();
const listeners = new Set<() => void>();

function set(next: AppState) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 무시 */
  }
  listeners.forEach((l) => l());
}

export function useApp(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

// ───────── 파생 값 ─────────
const indexCache = new WeakMap<Fits, Map<string, Set<string>>>();
export function fitIndex(s: AppState): Map<string, Set<string>> {
  let idx = indexCache.get(s.fits);
  if (!idx) indexCache.set(s.fits, (idx = buildIndex(s.fits)));
  return idx;
}
/** 내 차에 맞는 부품 id 집합 (차량 미등록이면 null) */
export function carFitSet(s: AppState): Set<string> | null {
  if (!s.car) return null;
  return fitIndex(s).get(s.car.trimId) ?? new Set();
}
export function carRef(s: AppState): TrimRef | null {
  return s.car ? findTrim(s.makers, s.car.trimId) : null;
}
export function carLabel(s: AppState): string {
  const ref = carRef(s);
  if (!ref || !s.car) return '';
  return `${ref.maker.name} ${ref.model.name} ${ref.trim.name} · ${s.car.year}년식`;
}
export function cartCount(s: AppState): number {
  return Object.values(s.cart).reduce((a, b) => a + b, 0);
}
export function mappingCount(s: AppState): number {
  return Object.values(s.fits).reduce((a, b) => a + b.length, 0);
}

// ───────── 내 차 · 장바구니 ─────────
export function setCar(car: Car | null) {
  set({ ...state, car });
}
export function addToCart(partId: string, qty = 1) {
  set({ ...state, cart: { ...state.cart, [partId]: (state.cart[partId] ?? 0) + qty } });
}
export function setQty(partId: string, qty: number) {
  const cart = { ...state.cart };
  if (qty <= 0) delete cart[partId];
  else cart[partId] = qty;
  set({ ...state, cart });
}
export function clearCart() {
  set({ ...state, cart: {} });
}

// ───────── 차량 조회 (중계 서버 호출) ─────────
export function lookupVehicle(raw: string, type: 'plate' | 'vin'): Promise<LookupResult> {
  return lookup(raw, type, {
    seed: SEED,
    master: state.makers,
    getCache: (k) => state.cache[k],
    putCache: (k, spec) => {
      const prev = state.cache[k];
      set({ ...state, cache: { ...state.cache, [k]: { spec, at: prev?.at ?? Date.now(), hits: prev ? prev.hits + 1 : 0 } } });
    },
    log: (e) => set({ ...state, log: [e, ...state.log].slice(0, 200) }),
  });
}
export function clearCache() {
  set({ ...state, cache: {}, log: [] });
}

// ───────── 관리자: 차종 마스터 ─────────
const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

function dropTrims(fits: Fits, removed: Set<string>): Fits {
  if (removed.size === 0) return fits;
  const out: Fits = {};
  for (const [k, v] of Object.entries(fits)) out[k] = v.filter((t) => !removed.has(t));
  return out;
}

export function addMaker(name: string): string {
  const id = uid('mk');
  set({ ...state, makers: [...state.makers, { id, name, models: [] }] });
  return id;
}
export function renameMaker(id: string, name: string) {
  set({ ...state, makers: state.makers.map((m) => (m.id === id ? { ...m, name } : m)) });
}
export function deleteMaker(id: string) {
  const gone = new Set(state.makers.find((m) => m.id === id)?.models.flatMap((m) => m.trims.map((t) => t.id)) ?? []);
  set({ ...state, makers: state.makers.filter((m) => m.id !== id), fits: dropTrims(state.fits, gone), car: state.car && gone.has(state.car.trimId) ? null : state.car });
}
export function addModel(makerId: string, name: string, code: string): string {
  const id = uid('md');
  set({
    ...state,
    makers: state.makers.map((m) => (m.id === makerId ? { ...m, models: [...m.models, { id, name, code, trims: [] }] } : m)),
  });
  return id;
}
export function updateModel(modelId: string, name: string, code: string) {
  set({
    ...state,
    makers: state.makers.map((m) => ({ ...m, models: m.models.map((x) => (x.id === modelId ? { ...x, name, code } : x)) })),
  });
}
export function deleteModel(modelId: string) {
  const gone = new Set(state.makers.flatMap((m) => m.models).find((x) => x.id === modelId)?.trims.map((t) => t.id) ?? []);
  set({
    ...state,
    makers: state.makers.map((m) => ({ ...m, models: m.models.filter((x) => x.id !== modelId) })),
    fits: dropTrims(state.fits, gone),
    car: state.car && gone.has(state.car.trimId) ? null : state.car,
  });
}
export type TrimInput = { name: string; fuel: Fuel; cc: number; engine: string; from: number; to: number };
export function addTrim(modelId: string, t: TrimInput): string {
  const id = uid('tr');
  set({
    ...state,
    makers: state.makers.map((m) => ({
      ...m,
      models: m.models.map((x) => (x.id === modelId ? { ...x, trims: [...x.trims, { id, ...t }] } : x)),
    })),
  });
  return id;
}
export function updateTrim(trimId: string, t: TrimInput) {
  set({
    ...state,
    makers: state.makers.map((m) => ({
      ...m,
      models: m.models.map((x) => ({ ...x, trims: x.trims.map((y) => (y.id === trimId ? { ...y, ...t } : y)) })),
    })),
  });
}
export function deleteTrim(trimId: string) {
  set({
    ...state,
    makers: state.makers.map((m) => ({ ...m, models: m.models.map((x) => ({ ...x, trims: x.trims.filter((y) => y.id !== trimId) })) })),
    fits: dropTrims(state.fits, new Set([trimId])),
    car: state.car?.trimId === trimId ? null : state.car,
  });
}

// ───────── 관리자: 부품-차종 매핑 ─────────
export function setFits(partId: string, trimIds: string[]) {
  set({ ...state, fits: { ...state.fits, [partId]: trimIds } });
}
export function toggleFits(partId: string, trimIds: string[], on: boolean) {
  const cur = new Set(state.fits[partId] ?? []);
  for (const t of trimIds) (on ? cur.add(t) : cur.delete(t));
  setFits(partId, [...cur]);
}

export function resetAll() {
  set(fresh());
}
