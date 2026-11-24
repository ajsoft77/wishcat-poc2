import { describe, expect, it } from 'vitest';
import { seedCatalog } from '../src/data/parts';
import { allTrims, modelYears, seedMakers, trimsOfYear } from '../src/data/vehicles';
import { alternatives, buildIndex, fitsTrim, normNo, searchParts } from '../src/lib/fit';
import { lookup, type CacheEntry, type LogEntry } from '../src/lib/relay';

const { parts, fits } = seedCatalog();
const makers = seedMakers();

describe('예시 데이터', () => {
  it('모든 매핑이 실제 트림을 가리킨다', () => {
    const ids = new Set(allTrims(makers).map((r) => r.trim.id));
    for (const [pid, trims] of Object.entries(fits)) {
      expect(trims.length, pid).toBeGreaterThan(0);
      for (const t of trims) expect(ids.has(t), `${pid} -> ${t}`).toBe(true);
    }
  });
  it('상품 id·카페24 상품번호가 겹치지 않는다', () => {
    expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length);
    expect(new Set(parts.map((p) => p.cafe24No)).size).toBe(parts.length);
  });
  it('연식을 고르면 그 해에 생산된 트림만 나온다', () => {
    const grandeur = makers[0].models.find((m) => m.id === 'grandeur')!;
    expect(modelYears(grandeur)[0]).toBe(2022);
    expect(trimsOfYear(grandeur, 2016).map((t) => t.id)).toEqual(['grandeur-24g']);
  });
});

describe('호환 검색', () => {
  it('차종별 색인이 매핑과 일치한다', () => {
    const idx = buildIndex(fits);
    const set = idx.get('avante-16g')!;
    expect(set.size).toBeGreaterThan(10);
    for (const id of set) expect(fitsTrim(fits, id, 'avante-16g')).toBe(true);
    const diesel = idx.get('sorento-22d')!;
    // 디젤 차량에는 점화플러그가 나오지 않는다
    expect(parts.filter((p) => diesel.has(p.id) && p.cat === 'plug')).toHaveLength(0);
  });
});

describe('품번 교차 검색', () => {
  const genuine = parts.find((p) => p.kind === '순정')!;
  it('순정 품번으로 순정 + 대체 부품이 함께 나온다', () => {
    const r = searchParts(parts, genuine.oem[0]);
    expect(r.cross).not.toBeNull();
    expect(r.items.map((p) => p.id)).toContain(genuine.id);
    expect(r.items.filter((p) => p.kind === '애프터마켓').length).toBe(2);
  });
  it('하이픈·공백·대소문자를 무시한다', () => {
    const loose = genuine.oem[0].replace('-', ' ').toLowerCase();
    expect(normNo(loose)).toBe(normNo(genuine.oem[0]));
    expect(searchParts(parts, loose).items.length).toBe(searchParts(parts, genuine.oem[0]).items.length);
  });
  it('대체품 품번으로 찾아도 순정품이 함께 나온다', () => {
    const alt = alternatives(parts, genuine)[0];
    const r = searchParts(parts, alt.sku);
    expect(r.items[0].id).toBe(alt.id);
    expect(r.items.map((p) => p.id)).toContain(genuine.id);
  });
  it('이름 검색은 교차 검색으로 처리하지 않는다', () => {
    const r = searchParts(parts, '브레이크 패드 아반떼');
    expect(r.cross).toBeNull();
    expect(r.items.length).toBe(3);
  });
});

describe('차량 조회(중계 서버) 캐시', () => {
  const mk = () => {
    const cache: Record<string, CacheEntry> = {};
    const log: LogEntry[] = [];
    return {
      log,
      deps: {
        seed: makers,
        master: makers,
        getCache: (k: string) => cache[k],
        putCache: (k: string, spec: CacheEntry['spec']) => void (cache[k] = { spec, at: 0, hits: 0 }),
        log: (e: LogEntry) => void log.push(e),
        wait: async () => {},
      },
    };
  };
  it('두 번째 조회는 캐시에서 응답한다', async () => {
    const { deps, log } = mk();
    const a = await lookup('12가 3456', 'plate', deps);
    const b = await lookup('12가3456', 'plate', deps);
    expect(a.ok && !a.cached && a.spec.trimId).toBe('avante-16g');
    expect(b.ok && b.cached).toBe(true);
    expect(log.map((l) => l.cached)).toEqual([false, true]);
  });
  it('형식이 틀리면 외부 호출 없이 거절한다', async () => {
    const { deps, log } = mk();
    expect((await lookup('ABC', 'plate', deps)).ok).toBe(false);
    expect((await lookup('SHORTVIN', 'vin', deps)).ok).toBe(false);
    expect(log).toHaveLength(0);
  });
  it('임의 번호도 항상 같은 차량, 생산 연식 범위 안으로 나온다', async () => {
    const { deps } = mk();
    const a = await lookup('987하6543', 'plate', deps);
    const { deps: d2 } = mk();
    const b = await lookup('987하6543', 'plate', d2);
    expect(a.ok && b.ok && a.spec.trimId === b.spec.trimId && a.spec.year === b.spec.year).toBe(true);
  });
  it('차종 마스터에서 지워진 차량은 미매칭으로 알린다', async () => {
    const { deps } = mk();
    const r = await lookup('12가3456', 'plate', { ...deps, master: [] });
    expect(r.ok && !r.matched).toBe(true);
  });
});
