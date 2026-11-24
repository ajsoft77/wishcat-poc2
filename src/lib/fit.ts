// 호환성·검색 로직 (순수 함수). 실제 구축 시 중계 서버의 검색 엔진이 맡는 부분이다.
import type { Part } from '../data/parts';

export type Fits = Record<string, string[]>;

/** 차종(트림) → 호환 부품 id 집합. 다대다 매핑을 한 번만 뒤집어 두고 조회는 O(1). */
export function buildIndex(fits: Fits): Map<string, Set<string>> {
  const idx = new Map<string, Set<string>>();
  for (const [partId, trims] of Object.entries(fits))
    for (const t of trims) {
      let set = idx.get(t);
      if (!set) idx.set(t, (set = new Set()));
      set.add(partId);
    }
  return idx;
}

export function fitsTrim(fits: Fits, partId: string, trimId: string): boolean {
  return (fits[partId] ?? []).includes(trimId);
}

/** 품번 비교용 정규화: 공백·하이픈 제거, 대문자 */
export function normNo(s: string): string {
  return s.replace(/[\s\-_.]/g, '').toUpperCase();
}

export type SearchResult = {
  items: Part[];
  /** 품번으로 찾았을 때: 기준이 된 순정 품번과, 함께 나온 순정품·대체품 수 */
  cross: { numbers: string[]; genuine: number; alt: number } | null;
};

/**
 * 부품명·브랜드·자체 품번·순정 품번(OEM) 통합 검색.
 * 품번이 일치하면 같은 순정 품번을 공유하는 부품(순정 + 대체품)을 모두 함께 돌려준다.
 */
export function searchParts(parts: Part[], query: string): SearchResult {
  const q = query.trim();
  if (!q) return { items: parts, cross: null };
  const n = normNo(q);
  const words = q.toLowerCase().split(/\s+/);

  const byNumber =
    n.length >= 4
      ? parts.filter((p) => normNo(p.sku).includes(n) || p.oem.some((o) => normNo(o).includes(n)))
      : [];
  if (byNumber.length > 0) {
    const numbers = new Set<string>();
    for (const p of byNumber) for (const o of p.oem) numbers.add(o);
    const directIds = new Set(byNumber.map((p) => p.id));
    const related = parts.filter((p) => !directIds.has(p.id) && p.oem.some((o) => numbers.has(o)));
    const items = [...byNumber, ...related];
    const genuine = items.filter((p) => p.kind === '순정').length;
    return { items, cross: { numbers: [...numbers], genuine, alt: items.length - genuine } };
  }

  const items = parts.filter((p) => {
    const hay = `${p.name} ${p.brand} ${p.kind}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  return { items, cross: null };
}

/** 같은 순정 품번을 쓰는 대체 부품 (자기 자신 제외) */
export function alternatives(parts: Part[], part: Part): Part[] {
  return parts.filter((p) => p.id !== part.id && p.oem.some((o) => part.oem.includes(o)));
}
