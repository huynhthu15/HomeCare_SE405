import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-6xl font-bold text-slate-300">404</p>
      <h1 className="text-xl font-bold">Không tìm thấy trang</h1>
      <Link to="/" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
        Về trang chủ
      </Link>
    </div>
  );
}
