import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { ProductCard } from '../components/Shop';
import { CATS, PARTS, catName, type CatId } from '../data/parts';
import { searchParts } from '../lib/fit';
import { nav, useRoute } from '../lib/router';
import { carFitSet, carLabel, useApp } from '../store';

const PAGE = 24;

export function List() {
  const s = useApp();
  const { query } = useRoute();
  const cat = (query.get('cat') as CatId | null) ?? null;
  const q = query.get('q') ?? '';
  const kind = query.get('kind') ?? '';
  const sort = query.get('sort') ?? '';
  const fit = carFitSet(s);
  const fitOnly = query.get('fit') === '1' && !!fit;
  const [shown, setShown] = useState(PAGE);

  const set = (patch: Record<string, string | undefined>) =>
    nav('/parts', { cat: cat ?? undefined, q: q || undefined, kind: kind || undefined, sort: sort || undefined, fit: fitOnly ? '1' : undefined, ...patch });

  const found = useMemo(() => searchParts(PARTS, q), [q]);

  // 카테고리 필터 전 단계 (카테고리별 개수 표시용)
  const base = useMemo(
    () => found.items.filter((p) => (!fitOnly || fit!.has(p.id)) && (!kind || p.kind === kind)),
    [found, fitOnly, fit, kind],
  );
  const items = useMemo(() => {
    const list = base.filter((p) => !cat || p.cat === cat);
    if (sort === 'low') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'high') return [...list].sort((a, b) => b.price - a.price);
    // 기본: 내 차 호환 부품을 위로
    if (fit && !fitOnly) return [...list].sort((a, b) => Number(fit.has(b.id)) - Number(fit.has(a.id)));
    return list;
  }, [base, cat, sort, fit, fitOnly]);

  useEffect(() => setShown(PAGE), [cat, q, kind, sort, fitOnly]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of base) out[p.cat] = (out[p.cat] ?? 0) + 1;
    return out;
  }, [base]);

  const title = q ? `"${q}" 검색 결과` : cat ? catName(cat) : '전체 부품';

  return (
    <div className="wrap list-page">
      <aside className="filters">
        <h3>카테고리</h3>
        <ul>
          <li>
            <button className={!cat ? 'on' : ''} onClick={() => set({ cat: undefined })}>
              전체 <span>{base.length.toLocaleString()}</span>
            </button>
          </li>
          {CATS.map((c) => (
            <li key={c.id}>
              <button className={cat === c.id ? 'on' : ''} disabled={!counts[c.id]} onClick={() => set({ cat: c.id })}>
                {c.name} <span>{(counts[c.id] ?? 0).toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>
        <h3>구분</h3>
        <div className="seg">
          {[
            ['', '전체'],
            ['순정', '순정'],
            ['애프터마켓', '애프터마켓'],
          ].map(([v, label]) => (
            <button key={v} className={kind === v ? 'on' : ''} onClick={() => set({ kind: v || undefined })}>{label}</button>
          ))}
        </div>
      </aside>

      <div className="list-main">
        <div className="list-head">
          <h1>{title}</h1>
          <p data-result-count>{items.length.toLocaleString()}개</p>
        </div>

        {found.cross && (
          <div className="cross-note" data-cross>
            <Icon name="swap" size={18} />
            <div>
              <b>품번 교차 검색</b>
              <p>
                순정 품번 {found.cross.numbers.map((n) => <span className="mono chip" key={n}>{n}</span>)} 기준으로
                순정품 {found.cross.genuine}개와 같은 규격의 대체 부품 {found.cross.alt}개를 함께 표시합니다.
              </p>
            </div>
          </div>
        )}

        <div className="toolbar">
          {fit ? (
            <label className={`switch ${fitOnly ? 'on' : ''}`} data-act="fit-toggle">
              <input type="checkbox" checked={fitOnly} onChange={(e) => set({ fit: e.target.checked ? '1' : undefined })} />
              <i />
              <span>
                <b>내 차에 맞는 부품만</b>
                <small>{carLabel(s)}</small>
              </span>
            </label>
          ) : (
            <p className="hint"><Icon name="car" size={17} />상단의 "내 차 등록"으로 차량을 등록하면 호환 부품만 볼 수 있습니다.</p>
          )}
          <select value={sort} onChange={(e) => set({ sort: e.target.value || undefined })} aria-label="정렬">
            <option value="">{fit && !fitOnly ? '내 차 호환 우선' : '기본순'}</option>
            <option value="low">낮은 가격순</option>
            <option value="high">높은 가격순</option>
          </select>
        </div>

        {items.length === 0 ? (
          <div className="empty">
            <b>조건에 맞는 부품이 없습니다</b>
            <p>검색어나 필터를 바꿔 보세요.</p>
            <a className="btn primary" href="#/parts">전체 부품 보기</a>
          </div>
        ) : (
          <>
            <div className="grid">
              {items.slice(0, shown).map((p) => (
                <ProductCard key={p.id} part={p} />
              ))}
            </div>
            {shown < items.length && (
              <button className="btn outline more" onClick={() => setShown(shown + PAGE)}>
                더 보기 ({shown}/{items.length})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
