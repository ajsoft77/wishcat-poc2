import { DemoBar, Footer, Header } from './components/Shop';
import { useRoute } from './lib/router';
import { Admin } from './pages/Admin';
import { Cart } from './pages/Cart';
import { Detail } from './pages/Detail';
import { Home } from './pages/Home';
import { List } from './pages/List';

export function App() {
  const { seg } = useRoute();
  if (seg[0] === 'admin') {
    return (
      <>
        <DemoBar />
        <Admin />
      </>
    );
  }
  return (
    <>
      <DemoBar />
      <Header />
      <main className="main">
        {seg.length === 0 && <Home />}
        {seg[0] === 'parts' && <List />}
        {seg[0] === 'p' && <Detail key={seg[1]} id={seg[1] ?? ''} />}
        {seg[0] === 'cart' && <Cart />}
        {seg.length > 0 && !['parts', 'p', 'cart'].includes(seg[0]) && <Home />}
      </main>
      <Footer />
    </>
  );
}
