import { Smartphone } from 'lucide-react';
import { useAuth } from '../../auth/auth-context';
import { UserMenu } from '../../layouts/UserMenu';

/**
 * Technicians work from the Expo mobile app (apps/technician — owner TV4): background GPS,
 * camera for before/after photos, push notifications. The web only shows this notice.
 */
export function TechnicianHomePage() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <Smartphone className="mx-auto text-sky-600" size={40} />
        <h1 className="mt-4 text-xl font-bold">Xin chào {user?.fullName}</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">Mã KTV: {user?.technicianCode}</p>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Công việc, chia sẻ vị trí và báo cáo hoàn thành được thực hiện trên ứng dụng di động
          HomeCare Technician.
        </p>
      </div>
      <UserMenu />
    </div>
  );
}
