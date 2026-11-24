import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { PartArt } from '../components/PartArt';
import { ProductCard, won } from '../components/Shop';
import { PARTS, PART_BY_ID, catName } from '../data/parts';
import { allTrims, yearText } from '../data/vehicles';
import { alternatives } from '../lib/fit';
import { href, nav } from '../lib/router';
import { addToCart, carFitSet, carLabel, useApp } from '../store';

type Tab = 'fit' | 'oem' | 'info';

export function Detail({ id }: { id: string }) {
  const s = useApp();
  const part = PART_BY_ID.get(id);
  const [tab, setTab] = useState<Tab>('fit');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const fitTrims = useMemo(() => {
    const ids = new Set(s.fits[id] ?? []);
    return allTrims(s.makers).filter((r) => ids.has(r.trim.id));
  }, [s.fits, s.makers, id]);
  const alts = useMemo(() => (part ? alternatives(PARTS, part) : []), [part]);

  if (!part) {
    return (
      <div className="wrap empty">
        <b>상품을 찾을 수 없습니다</b>
        <a className="btn primary" href="#/parts">전체 부품 보기</a>
      </div>
    );
  }

  const fit = carFitSet(s);
  const ok = fit?.has(part.id);

  return (
    <div className="wrap detail">
      <nav className="crumbs">
        <a href="#/">홈</a>
        <Icon name="chevron" size={13} />
        <a href={href('/parts', { cat: part.cat })}>{catName(part.cat)}</a>
      </nav>

      <div className="detail-top">
        <div className="detail-img">
          <PartArt cat={part.cat} />
          <span className={`kind ${part.kind === '순정' ? 'oe' : 'am'}`}>{part.kind}</span>
        </div>
        <div className="detail-info">
          <p className="brand">{part.brand}</p>
          <h1>{part.name}</h1>
          <dl className="nums">
            <div><dt>품번</dt><dd className="mono">{part.sku}</dd></div>
            <div>
              <dt>순정 품번(OEM)</dt>
              <dd>{part.oem.map((o) => <a className="mono chip" key={o} href={href('/parts', { q: o })}>{o}</a>)}</dd>
            </div>
          </dl>

          {!fit && (
            <div className="fitbox none" data-fitbox="none">
              <Icon name="car" size={22} />
              <div>
                <b>내 차에 맞는지 확인하세요</b>
                <p>상단의 "내 차 등록"에서 차량번호를 넣으면 호환 여부를 바로 알려 드립니다.</p>
              </div>
            </div>
          )}
          {fit && ok && (
            <div className="fitbox yes" data-fitbox="yes">
              <Icon name="shield" size={24} />
              <div>
                <b>내 차에 맞는 부품입니다</b>
                <p>{carLabel(s)}</p>
              </div>
            </div>
          )}
          {fit && !ok && (
            <div className="fitbox no" data-fitbox="no">
              <Icon name="x" size={24} />
              <div>
                <b>내 차에는 맞지 않는 부품입니다</b>
                <p>{carLabel(s)}</p>
                <a href={href('/parts', { cat: part.cat, fit: '1' })}>내 차에 맞는 {catName(part.cat)} 보기 →</a>
              </div>
            </div>
          )}

          <div className="buy">
            <b className="price big">{won(part.price * qty)}</b>
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="수량 줄이기"><Icon name="minus" size={16} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(qty + 1)} aria-label="수량 늘리기"><Icon name="plus" size={16} /></button>
            </div>
          </div>
          <div className="buy-actions">
            <button
              className="btn outline big"
              data-act="add-cart"
              onClick={() => {
                addToCart(part.id, qty);
                setAdded(true);
                window.setTimeout(() => setAdded(false), 1800);
              }}
            >
              {added ? '장바구니에 담았습니다' : '장바구니 담기'}
            </button>
            <button
              className="btn primary big"
              data-act="buy-now"
              onClick={() => {
                addToCart(part.id, qty);
                nav('/cart');
              }}
            >
              바로 구매
            </button>
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button className={tab === 'fit' ? 'on' : ''} data-tab="fit" onClick={() => setTab('fit')}>호환 차종 <span>{fitTrims.length}</span></button>
        <button className={tab === 'oem' ? 'on' : ''} data-tab="oem" onClick={() => setTab('oem')}>순정 품번 · 대체 부품 <span>{alts.length}</span></button>
        <button className={tab === 'info' ? 'on' : ''} data-tab="info" onClick={() => setTab('info')}>상품 정보</button>
      </div>

      {tab === 'fit' && (
        <div className="panel">
          {fitTrims.length === 0 ? (
            <p className="muted">등록된 호환 차종이 없습니다.</p>
          ) : (
            <div className="table-scroll">
              <table className="table" data-fit-table>
                <thead>
                  <tr><th>제조사</th><th>모델</th><th>세부 트림</th><th>엔진형식</th><th>적용 연식</th></tr>
                </thead>
                <tbody>
                  {fitTrims.map((r) => (
                    <tr key={r.trim.id} className={s.car?.trimId === r.trim.id ? 'mine' : ''}>
                      <td>{r.maker.name}</td>
                      <td>{r.model.name} <em>{r.model.code}</em></td>
                      <td>{r.trim.name}{s.car?.trimId === r.trim.id && <span className="tag">내 차</span>}</td>
                      <td className="mono">{r.trim.engine}</td>
                      <td>{yearText(r.trim)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'oem' && (
        <div className="panel">
          <h3>순정 품번 (OES/OEM)</h3>
          <p className="chips">
            {part.oem.map((o, i) => (
              <span className="mono chip" key={o}>{o}{i > 0 && <small> 구품번</small>}</span>
            ))}
          </p>
          <h3>같은 규격의 대체 부품</h3>
          {alts.length === 0 ? <p className="muted">대체 부품이 없습니다.</p> : (
            <div className="grid">
              {alts.map((p) => <ProductCard key={p.id} part={p} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'info' && (
        <div className="panel">
          <table className="table kv">
            <tbody>
              <tr><th>분류</th><td>{catName(part.cat)}</td></tr>
              <tr><th>브랜드</th><td>{part.brand}</td></tr>
              <tr><th>구분</th><td>{part.kind}</td></tr>
              <tr><th>적용</th><td>{part.fitNote}</td></tr>
              {part.spec.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
              <tr><th>카페24 상품번호</th><td className="mono">{part.cafe24No}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
