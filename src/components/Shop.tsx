// 쇼핑몰 공통: 헤더, 푸터, 상품 카드, 호환 배지
import { useEffect, useState, type ReactNode } from 'react';
import { CATS, type Part } from '../data/parts';
import { href, nav, useRoute } from '../lib/router';
import { carFitSet, carRef, cartCount, useApp } from '../store';
import { Icon } from './Icon';
import { PartArt } from './PartArt';
import { VehicleFinder } from './VehicleFinder';

export const won = (n: number) => `${n.toLocaleString()}원`;

export function DemoBar() {
  return <div className="demobar">시연용 프로토타입 · 상품·품번·가격은 예시 데이터이며 실제 결제되지 않습니다</div>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="닫기"><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Header() {
  const s = useApp();
  const route = useRoute();
  const [q, setQ] = useState(route.query.get('q') ?? '');
  const [carOpen, setCarOpen] = useState(false);
  const ref = carRef(s);
  const count = cartCount(s);
  const cat = route.path === '/parts' ? route.query.get('cat') : null;

  useEffect(() => {
    setQ(route.path === '/parts' ? (route.query.get('q') ?? '') : '');
  }, [route]);

  return (
    <header className="header">
      <div className="header-main wrap">
        <a className="logo" href="#/" aria-label="파츠핏 홈">
          <span className="logo-mark">P</span>
          <span className="logo-text">파츠핏<small>PARTSFIT</small></span>
        </a>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            nav('/parts', { q: q.trim() || undefined });
          }}
        >
          <Icon name="search" size={19} />
          <input name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="부품명 · 품번 · 순정번호(OEM) 검색" aria-label="부품 검색" />
          <button className="btn accent sm">검색</button>
        </form>
        <div className="header-actions">
          <button className={`car-chip ${ref ? 'on' : ''}`} data-act="car-chip" onClick={() => setCarOpen(true)}>
            <Icon name="car" size={19} />
            <span>{ref && s.car ? `${ref.model.name} ${s.car.year}` : '내 차 등록'}</span>
          </button>
          <a className="cart-btn" href="#/cart" aria-label="장바구니">
            <Icon name="cart" size={22} />
            {count > 0 && <i data-cart-count>{count}</i>}
          </a>
        </div>
      </div>
      <nav className="catnav">
        <div className="wrap catnav-in">
          <a className={route.path === '/parts' && !cat ? 'on' : ''} href={href('/parts')}>전체 부품</a>
          {CATS.map((c) => (
            <a key={c.id} className={cat === c.id ? 'on' : ''} href={href('/parts', { cat: c.id })}>{c.name}</a>
          ))}
          <a className="admin-link" href="#/admin">관리자 화면</a>
        </div>
      </nav>
      {carOpen && (
        <Modal title="내 차 등록 · 변경" onClose={() => setCarOpen(false)}>
          <VehicleFinder onDone={() => setCarOpen(false)} />
        </Modal>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <div>
          <b>파츠핏 (가칭)</b>
          <p>자동차 부품 쇼핑몰 시안 · 카페24 스킨 + 차량 검색 위젯 + 중계 서버 구성을 미리 보여 드리기 위한 화면입니다.</p>
        </div>
        <div className="footer-links">
          <a href="#/">쇼핑몰 홈</a>
          <a href="#/parts">전체 부품</a>
          <a href="#/admin">관리자 화면</a>
        </div>
      </div>
    </footer>
  );
}

export function FitBadge({ part }: { part: Part }) {
  const s = useApp();
  const set = carFitSet(s);
  if (!set) return <span className="fit none">차량 등록 시 호환 확인</span>;
  return set.has(part.id) ? (
    <span className="fit yes"><Icon name="check" size={14} />내 차 호환</span>
  ) : (
    <span className="fit no"><Icon name="x" size={14} />내 차 비호환</span>
  );
}

export function ProductCard({ part }: { part: Part }) {
  return (
    <a className="pcard" href={`#/p/${part.id}`} data-part={part.id}>
      <div className="pcard-img">
        <PartArt cat={part.cat} />
        <span className={`kind ${part.kind === '순정' ? 'oe' : 'am'}`}>{part.kind}</span>
      </div>
      <div className="pcard-body">
        <FitBadge part={part} />
        <h3>{part.name}</h3>
        <p className="mono sku">{part.sku}</p>
        <b className="price">{won(part.price)}</b>
      </div>
    </a>
  );
}
