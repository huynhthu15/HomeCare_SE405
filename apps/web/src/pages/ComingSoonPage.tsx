import { Construction } from 'lucide-react';
import type { CustomerModule } from '../config/modules';

/** Placeholder until the module owner ports the screen (see docs/team.md). */
export function ComingSoonPage({ module }: { module: CustomerModule }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <Construction className="mx-auto text-amber-500" size={36} />
      <h2 className="mt-4 text-xl font-bold">{module.label} đang được chuyển sang kiến trúc mới</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Phụ trách: <b>{module.owner}</b> · API:{' '}
        <code className="rounded bg-slate-100 px-1">{module.apiModule}</code>
      </p>
      {module.legacyFile && (
        <p className="mt-2 text-xs text-slate-500">
          Giao diện tham khảo:{' '}
          <code className="rounded bg-slate-100 px-1">{module.legacyFile}</code>
        </p>
      )}
    </div>
  );
}
