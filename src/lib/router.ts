// 해시 라우터: 정적 호스팅·하위 경로 어디에 올려도 동작한다.
import { useSyncExternalStore } from 'react';

export type Route = { path: string; seg: string[]; query: URLSearchParams };

function parse(): Route {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path, seg: path.split('/').filter(Boolean), query: new URLSearchParams(qs) };
}

let current = parse();
let currentHash = location.hash;
const listeners = new Set<() => void>();
window.addEventListener('hashchange', () => {
  if (location.hash === currentHash) return;
  const prevPath = current.path;
  currentHash = location.hash;
  current = parse();
  if (current.path !== prevPath) window.scrollTo(0, 0);
  listeners.forEach((l) => l());
});

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

export function href(path: string, query?: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v) q.set(k, v);
  const qs = q.toString();
  return `#${path}${qs ? `?${qs}` : ''}`;
}

export function nav(path: string, query?: Record<string, string | undefined>) {
  location.hash = href(path, query);
}
