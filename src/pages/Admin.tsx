// 부품-차종 매핑 전용 관리자 백오피스 (시안)
import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Shop';
import { PARTS, PART_BY_ID, catName } from '../data/parts';
import { allTrims, yearText, type Fuel, type Maker, type Model, type Trim } from '../data/vehicles';
import { normNo } from '../lib/fit';
import { useRoute } from '../lib/router';
import {
  addMaker,
  addModel,
  addTrim,
  clearCache,
  deleteMaker,
  deleteModel,
  deleteTrim,
  lookupVehicle,
  mappingCount,
  renameMaker,
  resetAll,
  setFits,
  toggleFits,
  updateModel,
  updateTrim,
  useApp,
  type AppState,
  type TrimInput,
} from '../store';

const MENU: [id: string, label: string, icon: string][] = [
  ['', '대시보드', 'grid'],
  ['master', '차종 마스터', 'car'],
  ['mapping', '부품-차종 매핑', 'link'],
  ['cache', '차량조회 캐시', 'db'],
  ['arch', '시스템 구성', 'server'],
];

export function Admin() {
  const s = useApp();
  const { seg } = useRoute();
  const page = seg[1] ?? '';
  return (
    <div className="admin">
      <aside className="admin-side">
        <a className="admin-logo" href="#/admin">
          <span className="logo-mark">P</span>
          <span>파츠핏 관리자</span>
        </a>
        <nav>
          {MENU.map(([id, label, icon]) => (
            <a key={id} className={page === id ? 'on' : ''} href={`#/admin${id ? `/${id}` : ''}`} data-admin={id || 'dash'}>
              <Icon name={icon} size={18} />
              {label}
            </a>
          ))}
        </nav>
        <div className="admin-side-foot">
          <a href="#/">← 쇼핑몰 보기</a>
          <button
            className="link"
            onClick={() => {
              if (confirm('관리자 수정 내용, 내 차, 장바구니, 조회 기록을 모두 처음 상태로 되돌릴까요?')) resetAll();
            }}
          >
            데모 초기화
          </button>
        </div>
      </aside>
      <main className="admin-main">
        {page === '' && <Dashboard s={s} />}
        {page === 'master' && <Master s={s} />}
        {page === 'mapping' && <Mapping s={s} />}
        {page === 'cache' && <Cache s={s} />}
        {page === 'arch' && <Arch />}
      </main>
    </div>
  );
}

function PageHead({ title, desc, children }: { title: string; desc: string; children?: ReactNode }) {
  return (
    <div className="admin-head">
      <div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className={`tile ${tone ?? ''}`}>
      <span>{label}</span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function cacheStats(s: AppState) {
  const total = s.log.length;
  const cached = s.log.filter((l) => l.cached).length;
  return { total, cached, api: total - cached, rate: total ? Math.round((cached / total) * 100) : 0 };
}

// ───────── 대시보드 ─────────
function Dashboard({ s }: { s: AppState }) {
  const trims = allTrims(s.makers).length;
  const unmapped = PARTS.filter((p) => (s.fits[p.id] ?? []).length === 0);
  const c = cacheStats(s);
  return (
    <>
      <PageHead title="대시보드" desc="부품·차종·매핑 현황을 한눈에 봅니다." />
      <div className="tiles">
        <Tile label="등록 부품" value={PARTS.length.toLocaleString()} sub="카페24 상품과 연결" />
        <Tile label="차종 (세부 트림)" value={trims.toLocaleString()} sub={`제조사 ${s.makers.length}곳`} />
        <Tile label="부품-차종 매핑" value={mappingCount(s).toLocaleString()} sub="건" />
        <Tile label="미매핑 부품" value={unmapped.length.toLocaleString()} sub="호환 차종 없음" tone={unmapped.length ? 'warn' : ''} />
        <Tile label="차량조회 캐시 적중률" value={`${c.rate}%`} sub={`조회 ${c.total}건 중 ${c.cached}건`} />
      </div>
      <div className="admin-cols">
        <section className="card">
          <h2>미매핑 부품</h2>
          {unmapped.length === 0 ? (
            <p className="muted">모든 부품에 호환 차종이 연결되어 있습니다.</p>
          ) : (
            <ul className="plain">
              {unmapped.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <a href={`#/admin/mapping?part=${p.id}`}>{p.name}</a>
                  <span className="mono">{p.sku}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2>최근 차량 조회</h2>
          {s.log.length === 0 ? (
            <p className="muted">아직 조회 기록이 없습니다. 쇼핑몰에서 차량번호를 조회해 보세요.</p>
          ) : (
            <ul className="plain">
              {s.log.slice(0, 8).map((l, i) => (
                <li key={i}>
                  <span className="mono">{l.key}</span>
                  <span className={`pill ${l.cached ? 'ok' : 'api'}`}>{l.cached ? '캐시' : '외부 API'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

// ───────── 차종 마스터 ─────────
type Form =
  | { type: 'maker'; id?: string; name: string }
  | { type: 'model'; id?: string; makerId: string; name: string; code: string }
  | ({ type: 'trim'; id?: string; modelId: string } & TrimInput);

const FUELS: Fuel[] = ['가솔린', '디젤', '하이브리드', 'LPG'];

function Master({ s }: { s: AppState }) {
  const [makerId, setMakerId] = useState(s.makers[0]?.id ?? '');
  const maker = s.makers.find((m) => m.id === makerId) ?? s.makers[0];
  const [modelId, setModelId] = useState(maker?.models[0]?.id ?? '');
  const model = maker?.models.find((m) => m.id === modelId) ?? maker?.models[0];
  const [form, setForm] = useState<Form | null>(null);

  const usage = useMemo(() => {
    const out = new Map<string, number>();
    for (const trims of Object.values(s.fits)) for (const t of trims) out.set(t, (out.get(t) ?? 0) + 1);
    return out;
  }, [s.fits]);
  const usedBy = (trims: Trim[]) => trims.reduce((a, t) => a + (usage.get(t.id) ?? 0), 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (form.type === 'maker') {
      if (form.id) renameMaker(form.id, form.name.trim());
      else {
        setMakerId(addMaker(form.name.trim()));
        setModelId('');
      }
    } else if (form.type === 'model') {
      if (form.id) updateModel(form.id, form.name.trim(), form.code.trim());
      else setModelId(addModel(form.makerId, form.name.trim(), form.code.trim()));
    } else {
      const { type: _t, id, modelId: mid, ...input } = form;
      void _t;
      const clean = { ...input, name: input.name.trim(), engine: input.engine.trim(), to: Math.max(input.from, input.to) };
      if (id) updateTrim(id, clean);
      else addTrim(mid, clean);
    }
    setForm(null);
  };

  const ask = (what: string, mapped: number) =>
    confirm(`${what}을(를) 삭제할까요?${mapped ? `\n연결된 부품 매핑 ${mapped.toLocaleString()}건도 함께 해제됩니다.` : ''}`);

  return (
    <>
      <PageHead title="차종 마스터" desc="제조사 › 모델 › 세부 트림 순서로 차량 기준 정보를 관리합니다. 여기서 바꾼 내용은 쇼핑몰 차종 선택과 호환 검색에 바로 반영됩니다." />
      <div className="miller">
        <section className="col" data-col="maker">
          <header>
            <h2>제조사 <span>{s.makers.length}</span></h2>
            <button className="btn sm outline" data-act="add-maker" onClick={() => setForm({ type: 'maker', name: '' })}><Icon name="plus" size={15} />추가</button>
          </header>
          <ul>
            {s.makers.map((m: Maker) => (
              <li key={m.id} className={m.id === maker?.id ? 'on' : ''}>
                <button className="row-main" onClick={() => { setMakerId(m.id); setModelId(m.models[0]?.id ?? ''); }}>
                  <b>{m.name}</b>
                  <small>모델 {m.models.length}</small>
                </button>
                <button className="icon-btn" aria-label="수정" onClick={() => setForm({ type: 'maker', id: m.id, name: m.name })}><Icon name="edit" size={16} /></button>
                <button className="icon-btn" aria-label="삭제" onClick={() => ask(`제조사 "${m.name}"`, usedBy(m.models.flatMap((x) => x.trims))) && deleteMaker(m.id)}><Icon name="trash" size={16} /></button>
              </li>
            ))}
          </ul>
        </section>

        <section className="col" data-col="model">
          <header>
            <h2>모델 <span>{maker?.models.length ?? 0}</span></h2>
            <button className="btn sm outline" data-act="add-model" disabled={!maker} onClick={() => maker && setForm({ type: 'model', makerId: maker.id, name: '', code: '' })}><Icon name="plus" size={15} />추가</button>
          </header>
          <ul>
            {maker?.models.map((m: Model) => (
              <li key={m.id} className={m.id === model?.id ? 'on' : ''}>
                <button className="row-main" onClick={() => setModelId(m.id)}>
                  <b>{m.name} <em>{m.code}</em></b>
                  <small>트림 {m.trims.length}</small>
                </button>
                <button className="icon-btn" aria-label="수정" onClick={() => setForm({ type: 'model', id: m.id, makerId: maker.id, name: m.name, code: m.code })}><Icon name="edit" size={16} /></button>
                <button className="icon-btn" aria-label="삭제" onClick={() => ask(`모델 "${m.name}"`, usedBy(m.trims)) && deleteModel(m.id)}><Icon name="trash" size={16} /></button>
              </li>
            ))}
            {maker && maker.models.length === 0 && <li className="none">등록된 모델이 없습니다</li>}
          </ul>
        </section>

        <section className="col wide" data-col="trim">
          <header>
            <h2>세부 트림 <span>{model?.trims.length ?? 0}</span></h2>
            <button
              className="btn sm outline"
              data-act="add-trim"
              disabled={!model}
              onClick={() => model && setForm({ type: 'trim', modelId: model.id, name: '', fuel: '가솔린', cc: 1600, engine: '', from: 2020, to: 2026 })}
            >
              <Icon name="plus" size={15} />추가
            </button>
          </header>
          <ul>
            {model?.trims.map((t: Trim) => (
              <li key={t.id}>
                <div className="row-main static">
                  <b>{t.name}</b>
                  <small>{t.fuel} · {t.cc.toLocaleString()}cc · {t.engine || '엔진형식 미입력'} · {yearText(t)} · 매핑 부품 {usage.get(t.id) ?? 0}개</small>
                </div>
                <button className="icon-btn" aria-label="수정" onClick={() => setForm({ type: 'trim', id: t.id, modelId: model.id, name: t.name, fuel: t.fuel, cc: t.cc, engine: t.engine, from: t.from, to: t.to })}><Icon name="edit" size={16} /></button>
                <button className="icon-btn" aria-label="삭제" onClick={() => ask(`트림 "${t.name}"`, usage.get(t.id) ?? 0) && deleteTrim(t.id)}><Icon name="trash" size={16} /></button>
              </li>
            ))}
            {model && model.trims.length === 0 && <li className="none">등록된 트림이 없습니다</li>}
            {!model && <li className="none">모델을 선택하세요</li>}
          </ul>
        </section>
      </div>

      {form && (
        <Modal
          title={`${form.type === 'maker' ? '제조사' : form.type === 'model' ? '모델' : '세부 트림'} ${form.id ? '수정' : '추가'}`}
          onClose={() => setForm(null)}
        >
          <form className="form-grid pad" onSubmit={submit}>
            {form.type === 'maker' && (
              <label className="full"><span>제조사명</span><input className="input" name="name" autoFocus required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            )}
            {form.type === 'model' && (
              <>
                <label><span>모델명</span><input className="input" name="name" autoFocus required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 아반떼" /></label>
                <label><span>차대 코드</span><input className="input" name="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="예: CN7" /></label>
              </>
            )}
            {form.type === 'trim' && (
              <>
                <label className="full"><span>트림명</span><input className="input" name="name" autoFocus required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 1.6 가솔린" /></label>
                <label>
                  <span>연료</span>
                  <select className="input" name="fuel" value={form.fuel} onChange={(e) => setForm({ ...form, fuel: e.target.value as Fuel })}>
                    {FUELS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </label>
                <label><span>배기량(cc)</span><input className="input" name="cc" type="number" min={0} required value={form.cc} onChange={(e) => setForm({ ...form, cc: Number(e.target.value) })} /></label>
                <label className="full"><span>엔진형식</span><input className="input" name="engine" value={form.engine} onChange={(e) => setForm({ ...form, engine: e.target.value })} placeholder="예: G4FM" /></label>
                <label><span>적용 시작 연식</span><input className="input" name="from" type="number" min={1990} max={2030} required value={form.from} onChange={(e) => setForm({ ...form, from: Number(e.target.value) })} /></label>
                <label><span>적용 종료 연식</span><input className="input" name="to" type="number" min={1990} max={2030} required value={form.to} onChange={(e) => setForm({ ...form, to: Number(e.target.value) })} /></label>
              </>
            )}
            <div className="full form-actions">
              <button type="button" className="btn outline" onClick={() => setForm(null)}>취소</button>
              <button className="btn primary" data-act="save-form">저장</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ───────── 부품-차종 매핑 ─────────
function Check({ state, onChange, label }: { state: 'all' | 'some' | 'none'; onChange: (on: boolean) => void; label: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={state === 'all'}
      ref={(el) => {
        if (el) el.indeterminate = state === 'some';
      }}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

function Mapping({ s }: { s: AppState }) {
  const { query } = useRoute();
  const [q, setQ] = useState('');
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [partId, setPartId] = useState(query.get('part') ?? PARTS[0].id);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const part = PART_BY_ID.get(partId) ?? PARTS[0];
  const cur = useMemo(() => new Set(s.fits[part.id] ?? []), [s.fits, part.id]);

  const list = useMemo(() => {
    const n = normNo(q);
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return PARTS.filter((p) => {
      if (onlyEmpty && (s.fits[p.id] ?? []).length > 0) return false;
      if (words.length === 0) return true;
      const name = p.name.toLowerCase();
      return words.every((w) => name.includes(w)) || normNo(p.sku).includes(n) || p.oem.some((o) => normNo(o).includes(n));
    });
  }, [q, onlyEmpty, s.fits]);

  const stateOf = (ids: string[]): 'all' | 'some' | 'none' => {
    const n = ids.filter((i) => cur.has(i)).length;
    return n === 0 ? 'none' : n === ids.length ? 'all' : 'some';
  };
  // 매핑된 차종이 있는 제조사·모델은 기본으로 펼친다
  const isOpen = (id: string, ids: string[]) => open[`${part.id}/${id}`] ?? ids.some((i) => cur.has(i));
  const flip = (id: string, ids: string[]) => setOpen({ ...open, [`${part.id}/${id}`]: !isOpen(id, ids) });

  return (
    <>
      <PageHead title="부품-차종 매핑" desc="부품을 고르고 호환되는 차종을 체크하면 바로 저장되어 쇼핑몰 호환 검색에 반영됩니다." />
      <div className="mapping">
        <section className="card map-list">
          <div className="map-search">
            <Icon name="search" size={18} />
            <input name="partq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="부품명 · 품번 · 순정번호" aria-label="부품 검색" />
          </div>
          <label className="check-line">
            <input type="checkbox" checked={onlyEmpty} onChange={(e) => setOnlyEmpty(e.target.checked)} />
            미매핑 부품만 보기
          </label>
          <p className="muted small">{list.length.toLocaleString()}개 {list.length > 80 && '(상위 80개 표시)'}</p>
          <ul>
            {list.slice(0, 80).map((p) => (
              <li key={p.id}>
                <button className={p.id === part.id ? 'on' : ''} data-map-part={p.id} onClick={() => setPartId(p.id)}>
                  <b>{p.name}</b>
                  <small><span className="mono">{p.sku}</span> · 호환 {(s.fits[p.id] ?? []).length}종</small>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card map-tree">
          <div className="map-part">
            <div>
              <span className={`kind ${part.kind === '순정' ? 'oe' : 'am'}`}>{part.kind}</span>
              <h2>{part.name}</h2>
              <p>
                {catName(part.cat)} · 품번 <span className="mono">{part.sku}</span> · 순정번호 <span className="mono">{part.oem.join(', ')}</span> · 카페24 상품번호 <span className="mono">{part.cafe24No}</span>
              </p>
            </div>
            <div className="map-count">
              <b data-map-count>{cur.size}</b>
              <span>호환 차종</span>
            </div>
          </div>
          <div className="map-tools">
            <span className="saved"><Icon name="check" size={15} />변경 즉시 저장 · 쇼핑몰 반영</span>
            <a href={`#/p/${part.id}`}>쇼핑몰에서 보기 →</a>
            <button className="link" onClick={() => setFits(part.id, [])}>전체 해제</button>
          </div>
          <div className="tree">
            {s.makers.map((mk) => {
              const mkIds = mk.models.flatMap((m) => m.trims.map((t) => t.id));
              if (mkIds.length === 0) return null;
              const mkOpen = isOpen(mk.id, mkIds);
              return (
                <div className="tree-maker" key={mk.id}>
                  <div className="tree-row lv1">
                    <button className={`twist ${mkOpen ? 'open' : ''}`} onClick={() => flip(mk.id, mkIds)} aria-label="펼치기"><Icon name="chevron" size={15} /></button>
                    <Check label={mk.name} state={stateOf(mkIds)} onChange={(on) => toggleFits(part.id, mkIds, on)} />
                    <b onClick={() => flip(mk.id, mkIds)}>{mk.name}</b>
                    <small>{mkIds.filter((i) => cur.has(i)).length}/{mkIds.length}</small>
                  </div>
                  {mkOpen &&
                    mk.models.map((m) => {
                      const ids = m.trims.map((t) => t.id);
                      if (ids.length === 0) return null;
                      const mOpen = isOpen(m.id, ids);
                      return (
                        <div key={m.id}>
                          <div className="tree-row lv2">
                            <button className={`twist ${mOpen ? 'open' : ''}`} onClick={() => flip(m.id, ids)} aria-label="펼치기"><Icon name="chevron" size={15} /></button>
                            <Check label={m.name} state={stateOf(ids)} onChange={(on) => toggleFits(part.id, ids, on)} />
                            <b onClick={() => flip(m.id, ids)}>{m.name} <em>{m.code}</em></b>
                            <small>{ids.filter((i) => cur.has(i)).length}/{ids.length}</small>
                          </div>
                          {mOpen &&
                            m.trims.map((t) => (
                              <label className="tree-row lv3" key={t.id}>
                                <input type="checkbox" data-trim={t.id} checked={cur.has(t.id)} onChange={(e) => toggleFits(part.id, [t.id], e.target.checked)} />
                                <span>{t.name}</span>
                                <small>{t.fuel} · {t.engine} · {yearText(t)}</small>
                              </label>
                            ))}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

// ───────── 차량조회 캐시 ─────────
function Cache({ s }: { s: AppState }) {
  const [unit, setUnit] = useState(50);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const c = cacheStats(s);
  const time = (at: number) => new Date(at).toLocaleTimeString('ko-KR', { hour12: false });

  const test = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const r = await lookupVehicle(key, 'plate');
    setBusy(false);
    setMsg(r.ok ? `${r.spec.maker} ${r.spec.model} ${r.spec.trim} · ${r.cached ? '캐시 응답' : '외부 API 호출'} ${(r.ms / 1000).toFixed(2)}초` : r.error);
  };

  return (
    <>
      <PageHead title="차량조회 캐시" desc="한 번 조회한 차량번호는 자체 DB에 저장해 두고, 다시 조회할 때는 외부 API를 부르지 않습니다.">
        <button className="btn outline sm" onClick={() => confirm('저장된 조회 결과와 기록을 모두 지울까요?') && clearCache()}>캐시 비우기</button>
      </PageHead>
      <div className="tiles">
        <Tile label="전체 조회" value={c.total.toLocaleString()} sub="건" />
        <Tile label="외부 API 호출" value={c.api.toLocaleString()} sub="과금 대상" />
        <Tile label="캐시 응답" value={c.cached.toLocaleString()} sub={`적중률 ${c.rate}%`} tone="ok" />
        <Tile label="저장된 차량" value={Object.keys(s.cache).length.toLocaleString()} sub="대" />
        <div className="tile">
          <span>절감 추정액</span>
          <b data-saved>{(c.cached * unit).toLocaleString()}원</b>
          <small>
            건당 <input className="unit" type="number" min={0} value={unit} onChange={(e) => setUnit(Number(e.target.value))} aria-label="API 건당 단가" />원 가정
          </small>
        </div>
      </div>

      <section className="card">
        <h2>조회 테스트</h2>
        <form className="inline-form" onSubmit={test}>
          <input className="input" name="testkey" value={key} onChange={(e) => setKey(e.target.value)} placeholder="차량번호 (예: 12가3456)" />
          <button className="btn primary" disabled={busy || !key.trim()} data-act="cache-test">{busy ? '조회 중…' : '조회'}</button>
          {msg && <span className="muted" data-test-msg>{msg}</span>}
        </form>
        <p className="muted small">같은 번호를 두 번 조회하면 두 번째는 캐시에서 바로 응답합니다.</p>
      </section>

      <section className="card">
        <h2>조회 기록</h2>
        {s.log.length === 0 ? (
          <p className="muted">아직 조회 기록이 없습니다.</p>
        ) : (
          <div className="table-scroll">
            <table className="table" data-log>
              <thead><tr><th>시각</th><th>구분</th><th>번호</th><th>처리</th><th>응답 시간</th></tr></thead>
              <tbody>
                {s.log.slice(0, 50).map((l, i) => (
                  <tr key={i}>
                    <td>{time(l.at)}</td>
                    <td>{l.type === 'plate' ? '차량번호' : '차대번호'}</td>
                    <td className="mono">{l.key}</td>
                    <td><span className={`pill ${l.cached ? 'ok' : 'api'}`}>{l.cached ? '캐시 응답' : '외부 API 호출'}</span></td>
                    <td>{(l.ms / 1000).toFixed(2)}초</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

// ───────── 시스템 구성 ─────────
function Arch() {
  return (
    <>
      <PageHead title="시스템 구성 (제안)" desc="카페24 쇼핑몰은 그대로 두고, 차량 조회와 호환 검색만 외부 중계 서버가 맡는 구조입니다." />
      <section className="card">
        <div className="arch">
          <div className="arch-col">
            <div className="node shop">
              <b>카페24 쇼핑몰</b>
              <p>스킨(PC·모바일) · 회원 · 장바구니 · 결제(PG) · 주문/배송</p>
              <span>+ 차량 검색 위젯 (스킨에 넣는 JS)</span>
            </div>
            <div className="node admin-node">
              <b>매핑 관리자 (이 화면)</b>
              <p>차종 마스터 · 부품-차종 매핑 · 조회 캐시</p>
            </div>
          </div>
          <div className="arch-arrow"><i />요청 · 응답<i /></div>
          <div className="arch-col">
            <div className="node relay">
              <b>중계 서버</b>
              <ul>
                <li>차량 조회 API (캐시 우선)</li>
                <li>호환 검색 API (차종 → 상품번호 목록)</li>
                <li>품번 교차 검색</li>
                <li>관리자 API</li>
              </ul>
            </div>
          </div>
          <div className="arch-arrow"><i />연동<i /></div>
          <div className="arch-col">
            <div className="node ext"><b>외부 차량정보 API</b><p>차량번호·차대번호 → 차종·연식·엔진형식</p></div>
            <div className="node ext"><b>매핑 DB</b><p>차종 마스터 · 부품-차종 매핑(N:M) · 조회 캐시</p></div>
            <div className="node ext"><b>카페24 Open API</b><p>상품 정보 동기화 (상품번호 기준)</p></div>
          </div>
        </div>
      </section>
      <section className="card">
        <h2>차량번호 검색 한 번의 흐름</h2>
        <ol className="flow">
          <li><b>위젯</b><span>고객이 넣은 차량번호를 중계 서버로 보냅니다.</span></li>
          <li><b>캐시 확인</b><span>이미 조회한 번호면 저장된 제원을 바로 돌려줍니다. 없을 때만 외부 API를 호출합니다.</span></li>
          <li><b>차종 매칭</b><span>조회된 제원 코드를 차종 마스터의 세부 트림과 맞춥니다.</span></li>
          <li><b>호환 검색</b><span>그 트림에 연결된 카페24 상품번호 목록을 돌려줍니다. 미리 만들어 둔 색인을 쓰기 때문에 상품 수가 늘어도 느려지지 않습니다.</span></li>
          <li><b>표시</b><span>스킨이 해당 상품만 목록으로 보여 주고, 상품마다 호환 여부를 표시합니다.</span></li>
        </ol>
        <p className="muted small">이 시안은 서버 없이 같은 흐름을 화면에서 재현한 것입니다. 차량 제원은 가상 데이터이며, 응답 시간 차이(외부 API / 캐시)만 실제와 비슷하게 넣었습니다.</p>
      </section>
    </>
  );
}
