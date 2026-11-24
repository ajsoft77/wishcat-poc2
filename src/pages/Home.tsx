import { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { PartArt } from '../components/PartArt';
import { ProductCard } from '../components/Shop';
import { VehicleFinder } from '../components/VehicleFinder';
import { CATS, PARTS } from '../data/parts';
import { href } from '../lib/router';
import { carFitSet, carRef, mappingCount, useApp } from '../store';

export function Home() {
  const s = useApp();
  const fit = carFitSet(s);
  const ref = carRef(s);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of PARTS) if (!fit || fit.has(p.id)) out[p.cat] = (out[p.cat] ?? 0) + 1;
    return out;
  }, [fit]);

  // 카테고리별로 하나씩 골라 8개 (차량 등록 시 호환 부품만)
  const picks = useMemo(() => {
    const out = [];
    for (const c of CATS) {
      const p = PARTS.find((x) => x.cat === c.id && (!fit || fit.has(x.id)));
      if (p) out.push(p);
      if (out.length === 8) break;
    }
    return out;
  }, [fit]);

  const sampleOem = PARTS[0].oem[0];

  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-copy">
            <p className="eyebrow">자동차 부품 전문몰</p>
            <h1>
              차량번호만 넣으면,
              <br />
              <span>내 차에 맞는 부품만</span>
            </h1>
            <p className="hero-desc">
              차종·연식·세부 트림마다 다른 규격, 더 이상 직접 찾지 않아도 됩니다.
              <br />
              번호 한 번 입력으로 호환 부품만 골라 보여 드립니다.
            </p>
            <ul className="hero-points">
              <li><Icon name="check" size={16} />부품 {PARTS.length.toLocaleString()}종</li>
              <li><Icon name="check" size={16} />호환 매핑 {mappingCount(s).toLocaleString()}건</li>
              <li><Icon name="check" size={16} />순정 품번 교차 검색</li>
            </ul>
          </div>
          <div className="hero-finder">
            <h2>내 차 찾기</h2>
            <VehicleFinder />
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>{ref ? `${ref.model.name}에 맞는 부품 카테고리` : '부품 카테고리'}</h2>
          {ref && <p>등록한 차량에 호환되는 부품 수만 표시합니다.</p>}
        </div>
        <div className="cats">
          {CATS.map((c) => (
            <a key={c.id} className="cat" href={href('/parts', { cat: c.id, fit: fit ? '1' : undefined })} data-cat={c.id}>
              <PartArt cat={c.id} />
              <b>{c.name}</b>
              <span>{(counts[c.id] ?? 0).toLocaleString()}개</span>
            </a>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <h2>{ref ? '내 차 호환 추천 부품' : '많이 찾는 부품'}</h2>
          <a href={href('/parts', { fit: fit ? '1' : undefined })}>전체 보기 <Icon name="chevron" size={15} /></a>
        </div>
        <div className="grid">
          {picks.map((p) => (
            <ProductCard key={p.id} part={p} />
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="steps">
          <div className="step">
            <i>1</i>
            <b>차량번호 입력</b>
            <p>차량번호나 차대번호를 넣거나, 제조사·모델·연식·트림을 차례로 고릅니다.</p>
          </div>
          <div className="step">
            <i>2</i>
            <b>차량 제원 자동 조회</b>
            <p>차량정보 API로 차종·연식·엔진형식을 확인하고, 한 번 조회한 차량은 저장해 바로 응답합니다.</p>
          </div>
          <div className="step">
            <i>3</i>
            <b>호환 부품만 표시</b>
            <p>내 차에 맞는 부품만 골라 보여 주고, 상품마다 호환 여부를 표시해 오주문을 줄입니다.</p>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="cross-promo">
          <div>
            <h2>순정 품번으로 대체 부품까지 한 번에</h2>
            <p>순정 번호(OEM)나 호환 품번을 검색하면, 같은 규격의 순정품과 애프터마켓 대체품이 함께 나옵니다.</p>
          </div>
          <a className="btn light" href={href('/parts', { q: sampleOem })} data-act="cross-sample">
            <Icon name="swap" size={18} />
            <span className="mono">{sampleOem}</span> 검색해 보기
          </a>
        </div>
      </section>
    </>
  );
}
