'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/automations', label: 'Automations' },
  { href: '/logs', label: 'Logs' },
  { href: '/settings', label: 'Settings', adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-4">
        <p className="text-sm font-semibold text-gray-900">Control Center</p>
        <p className="text-xs text-gray-500">WhatsApp Automation</p>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'ADMIN').map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 px-4 py-4">
        <p className="truncate text-xs font-medium text-gray-900">{user?.name}</p>
        <p className="truncate text-xs text-gray-500">{user?.role}</p>
        <button
          onClick={handleLogout}
          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
