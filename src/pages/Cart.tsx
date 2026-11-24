import { useState } from 'react';
import { Icon } from '../components/Icon';
import { PartArt } from '../components/PartArt';
import { FitBadge, Modal, won } from '../components/Shop';
import { PART_BY_ID } from '../data/parts';
import { carFitSet, carLabel, clearCart, setQty, useApp } from '../store';

const SHIP_FREE = 50000;
const SHIP_FEE = 3000;

export function Cart() {
  const s = useApp();
  const [done, setDone] = useState<{ no: string; car: string } | null>(null);
  const [carNo, setCarNo] = useState(s.car?.key ?? '');
  const items = Object.entries(s.cart)
    .map(([id, qty]) => ({ part: PART_BY_ID.get(id)!, qty }))
    .filter((x) => x.part);
  const fit = carFitSet(s);
  const misfit = fit ? items.filter((x) => !fit.has(x.part.id)) : [];
  const sum = items.reduce((a, x) => a + x.part.price * x.qty, 0);
  const ship = sum === 0 || sum >= SHIP_FREE ? 0 : SHIP_FEE;

  return (
    <div className="wrap cart-page">
      <h1>장바구니 · 주문</h1>
      {items.length === 0 ? (
        <div className="empty">
          <b>장바구니가 비어 있습니다</b>
          <p>내 차에 맞는 부품을 담아 보세요.</p>
          <a className="btn primary" href="#/parts">부품 보러 가기</a>
        </div>
      ) : (
        <div className="cart-cols">
          <div>
            <ul className="cart-list">
              {items.map(({ part, qty }) => (
                <li key={part.id} data-cart-item={part.id}>
                  <a className="cart-img" href={`#/p/${part.id}`}><PartArt cat={part.cat} /></a>
                  <div className="cart-body">
                    <FitBadge part={part} />
                    <a href={`#/p/${part.id}`}><b>{part.name}</b></a>
                    <p className="mono sku">{part.sku}</p>
                    <div className="cart-row">
                      <div className="qty sm">
                        <button onClick={() => setQty(part.id, qty - 1)} aria-label="수량 줄이기"><Icon name="minus" size={14} /></button>
                        <span>{qty}</span>
                        <button onClick={() => setQty(part.id, qty + 1)} aria-label="수량 늘리기"><Icon name="plus" size={14} /></button>
                      </div>
                      <b className="price">{won(part.price * qty)}</b>
                      <button className="icon-btn" onClick={() => setQty(part.id, 0)} aria-label="삭제"><Icon name="trash" size={18} /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {misfit.length > 0 && (
              <div className="fitbox no" data-misfit>
                <Icon name="x" size={22} />
                <div>
                  <b>내 차에 맞지 않는 부품이 {misfit.length}개 있습니다</b>
                  <p>{carLabel(s)} 기준입니다. 주문 전에 다시 확인해 주세요.</p>
                </div>
              </div>
            )}

            <form
              className="order-form"
              id="order"
              onSubmit={(e) => {
                e.preventDefault();
                setDone({ no: `D${Date.now().toString().slice(-8)}`, car: carNo.trim() });
                clearCart();
              }}
            >
              <h2>주문 정보</h2>
              <div className="form-grid">
                <label><span>받는 분</span><input className="input" name="name" required placeholder="이름" /></label>
                <label><span>연락처</span><input className="input" name="phone" required placeholder="010-0000-0000" inputMode="tel" /></label>
                <label className="full"><span>배송지</span><input className="input" name="addr" required placeholder="주소" /></label>
                <label className="full car-field">
                  <span>차량번호 또는 차대번호(VIN) <em>부품 호환 확인용</em></span>
                  <input className="input" name="carNo" value={carNo} onChange={(e) => setCarNo(e.target.value)} placeholder="예: 12가3456" />
                  <small>입력해 주시면 출고 전에 호환 여부를 한 번 더 확인합니다. (카페24 주문서 추가 입력 항목)</small>
                </label>
                <label className="full"><span>배송 메모</span><input className="input" name="memo" placeholder="선택 입력" /></label>
              </div>
            </form>
          </div>

          <aside className="summary">
            <h2>결제 금액</h2>
            <dl>
              <div><dt>상품 금액</dt><dd>{won(sum)}</dd></div>
              <div><dt>배송비</dt><dd>{ship ? won(ship) : '무료'}</dd></div>
              <div className="total"><dt>합계</dt><dd data-total>{won(sum + ship)}</dd></div>
            </dl>
            <button className="btn primary big wide" form="order" data-act="order">주문하기</button>
            <p className="muted small">시연용 화면입니다. 실제 결제는 카페24 결제(PG)로 진행됩니다.</p>
          </aside>
        </div>
      )}

      {done && (
        <Modal title="주문 접수 (시연)" onClose={() => setDone(null)}>
          <div className="done" data-order-done>
            <span className="done-icon"><Icon name="check" size={30} /></span>
            <b>주문이 접수되었습니다</b>
            <p>주문번호 <span className="mono">{done.no}</span></p>
            {done.car && <p>호환 확인 차량: <span className="mono">{done.car}</span></p>}
            <p className="muted small">시연용이라 실제 결제·배송은 이루어지지 않습니다.</p>
            <a className="btn primary" href="#/" onClick={() => setDone(null)}>쇼핑 계속하기</a>
          </div>
        </Modal>
      )}
    </div>
  );
}
