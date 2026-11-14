export type Owner = 'TV1' | 'TV2' | 'TV3' | 'TV4';

export interface ScreenStatus {
  /** Route prefix of the screen */
  path: string;
  owner: Owner;
  /** Backend module(s) the screen reads from */
  apiModule: string;
  /**
   * true once the screen talks to the new backend. While false, CustomerLayout shows a banner
   * telling the team which API the screen is waiting for (docs/frontend-migration.md).
   */
  ready: boolean;
}

/** Owners flip `ready` to true in the PR that connects their screen to the new API. */
export const customerScreens: ScreenStatus[] = [
  { path: '/', owner: 'TV1', apiModule: 'profile (GET /dashboard)', ready: false },
  { path: '/cleaning', owner: 'TV2', apiModule: 'catalog + booking', ready: false },
  { path: '/repair', owner: 'TV2', apiModule: 'catalog + booking', ready: false },
  { path: '/appliance', owner: 'TV1', apiModule: 'profile (devices, reminders)', ready: false },
  { path: '/booking', owner: 'TV2', apiModule: 'catalog + booking + dispatch', ready: false },
  { path: '/tracking', owner: 'TV4', apiModule: 'tracking (Socket.IO)', ready: false },
  { path: '/payment', owner: 'TV3', apiModule: 'payments', ready: false },
  { path: '/profile', owner: 'TV1', apiModule: 'profile', ready: false },
];

export function moduleFor(pathname: string): ScreenStatus {
  return (
    customerScreens.filter((m) => m.path !== '/').find((m) => pathname.startsWith(m.path)) ??
    customerScreens[0]!
  );
}
