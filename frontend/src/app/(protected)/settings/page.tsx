'use client';

import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return (
      <div>
        <h1 className="mb-1 text-lg font-semibold text-gray-900">Settings</h1>
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-status-error">
          You need Admin access to view Settings. (Note: this is a UX guard only — the backend
          also enforces this on every settings endpoint.)
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-gray-900">Settings</h1>
      <p className="text-sm text-gray-500">
        WhatsApp, WaSenderAPI, n8n, automation defaults, and system settings (Section 26) are
        implemented in the Settings/Production stage.
      </p>
    </div>
  );
}
