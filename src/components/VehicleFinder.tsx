// 차량 검색 위젯: 차량번호 / 차종 단계 선택 / 차대번호(VIN)
import { useState } from 'react';
import { modelYears, trimsOfYear, yearText } from '../data/vehicles';
import { nav } from '../lib/router';
import { SAMPLE_PLATES, SAMPLE_VINS, type LookupResult } from '../lib/relay';
import { carFitSet, carRef, lookupVehicle, setCar, useApp } from '../store';
import { Icon } from './Icon';

type Tab = 'plate' | 'select' | 'vin';

export function VehicleFinder({ onDone }: { onDone?: () => void }) {
  const s = useApp();
  const [tab, setTab] = useState<Tab>('plate');
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<LookupResult | null>(null);

  const [makerId, setMakerId] = useState('');
  const [modelId, setModelId] = useState('');
  const [year, setYear] = useState(0);

  const maker = s.makers.find((m) => m.id === makerId);
  const model = maker?.models.find((m) => m.id === modelId);
  const years = model ? modelYears(model) : [];
  const trims = model && year ? trimsOfYear(model, year) : [];

  const run = async (raw: string, type: 'plate' | 'vin') => {
    if (busy) return;
    setBusy(true);
    setRes(null);
    const r = await lookupVehicle(raw, type);
    setBusy(false);
    setRes(r);
    if (r.ok && r.matched) setCar({ trimId: r.spec.trimId, year: r.spec.year, key: r.spec.key, via: type });
  };

  const ref = carRef(s);
  const fitCount = carFitSet(s)?.size ?? 0;
  const goParts = () => {
    onDone?.();
    nav('/parts', { fit: '1' });
  };

  return (
    <div className="finder">
      <div className="finder-tabs" role="tablist">
        {(
          [
            ['plate', '차량번호'],
            ['select', '차종 선택'],
            ['vin', '차대번호'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} data-tab={id} onClick={() => { setTab(id); setRes(null); }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'plate' && (
        <form
          className="finder-body"
          onSubmit={(e) => {
            e.preventDefault();
            run(plate, 'plate');
          }}
        >
          <div className="plate-row">
            <label className="plate">
              <span className="plate-bolt" />
              <input name="plate" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="12가3456" autoComplete="off" maxLength={9} aria-label="차량번호" />
              <span className="plate-bolt" />
            </label>
            <button className="btn accent" disabled={busy || !plate.trim()} data-act="lookup-plate">
              {busy ? '조회 중…' : '내 차 조회'}
            </button>
          </div>
          <div className="samples">
            <span>예시 번호</span>
            {SAMPLE_PLATES.map((p) => (
              <button type="button" key={p.plate} data-sample={p.plate} onClick={() => { setPlate(p.plate); run(p.plate, 'plate'); }}>
                {p.plate}
              </button>
            ))}
          </div>
        </form>
      )}

      {tab === 'vin' && (
        <form
          className="finder-body"
          onSubmit={(e) => {
            e.preventDefault();
            run(vin, 'vin');
          }}
        >
          <div className="plate-row">
            <input className="input mono" name="vin" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} placeholder="차대번호 17자리" autoComplete="off" maxLength={17} aria-label="차대번호" />
            <button className="btn accent" disabled={busy || !vin.trim()} data-act="lookup-vin">
              {busy ? '조회 중…' : '내 차 조회'}
            </button>
          </div>
          <div className="samples">
            <span>예시 번호</span>
            {SAMPLE_VINS.map((p) => (
              <button type="button" className="mono" key={p.vin} onClick={() => { setVin(p.vin); run(p.vin, 'vin'); }}>
                {p.vin}
              </button>
            ))}
          </div>
        </form>
      )}

      {tab === 'select' && (
        <div className="finder-body">
          <div className="drill">
            <label>
              <span>1. 제조사</span>
              <select name="maker" value={makerId} onChange={(e) => { setMakerId(e.target.value); setModelId(''); setYear(0); }}>
                <option value="">선택</option>
                {s.makers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>2. 모델</span>
              <select name="model" value={modelId} disabled={!maker} onChange={(e) => { setModelId(e.target.value); setYear(0); }}>
                <option value="">선택</option>
                {maker?.models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </select>
            </label>
            <label>
              <span>3. 연식</span>
              <select name="year" value={year || ''} disabled={!model} onChange={(e) => setYear(Number(e.target.value))}>
                <option value="">선택</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </label>
            <label>
              <span>4. 세부 트림</span>
              <select
                name="trim"
                value=""
                disabled={!year}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setRes(null);
                  setCar({ trimId: e.target.value, year, via: 'manual' });
                }}
              >
                <option value="">선택</option>
                {trims.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} · {t.fuel}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {busy && (
        <div className="finder-status">
          <span className="spinner" /> 차량 정보를 조회하고 있습니다…
        </div>
      )}
      {res && !res.ok && <div className="finder-status error">{res.error}</div>}
      {res && res.ok && !res.matched && (
        <div className="finder-status error">
          {res.spec.maker} {res.spec.model} {res.spec.trim} 차량으로 조회되었지만, 차종 기준 정보에 등록되지 않은 차량입니다. 관리자 확인이 필요합니다.
        </div>
      )}

      {ref && s.car && !busy && (
        <div className="mycar" data-mycar>
          <div className="mycar-head">
            <span className="mycar-icon"><Icon name="car" size={22} /></span>
            <div>
              <b>{ref.maker.name} {ref.model.name} <em>{ref.model.code}</em></b>
              <p>{s.car.year}년식 · {ref.trim.name}{s.car.key ? ` · ${s.car.key}` : ''}</p>
            </div>
            <button className="link" onClick={() => { setCar(null); setRes(null); }}>해제</button>
          </div>
          <dl className="spec">
            <div><dt>엔진형식</dt><dd>{ref.trim.engine}</dd></div>
            <div><dt>배기량</dt><dd>{ref.trim.cc.toLocaleString()}cc</dd></div>
            <div><dt>연료</dt><dd>{ref.trim.fuel}</dd></div>
            <div><dt>생산</dt><dd>{yearText(ref.trim)}</dd></div>
          </dl>
          {res && res.ok && res.matched && (
            <p className={`via ${res.cached ? 'cached' : ''}`} data-via={res.cached ? 'cache' : 'api'}>
              <Icon name={res.cached ? 'db' : 'bolt'} size={15} />
              {res.cached
                ? `저장된 조회 결과 사용 · ${(res.ms / 1000).toFixed(2)}초 (외부 API 호출 없음)`
                : `외부 차량정보 API 조회 · ${(res.ms / 1000).toFixed(2)}초`}
            </p>
          )}
          <button className="btn primary wide" data-act="go-fit" onClick={goParts}>
            내 차 호환 부품 {fitCount.toLocaleString()}개 보기
          </button>
        </div>
      )}
    </div>
  );
}
