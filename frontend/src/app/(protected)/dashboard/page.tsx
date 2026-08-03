'use client';

import { useEffect, useState } from 'react';

type DashboardStatus = {
  whatsapp: {
    connected: boolean;
    phone: string | null;
    session: string | null;
  };
  n8n: {
    online: boolean;
  };
  activeAutomations: number;
  humanTakeovers: number;
  messagesToday: number;
  failedAutomations: number;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStatus | null>(null);

  useEffect(() => {
    fetch(`${API}/dashboard/status`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return <div className="p-6">Loading...</div>;
  }

  const cards = [
    {
      title: 'WhatsApp Connection',
      value: data.whatsapp.connected
        ? `🟢 Connected (${data.whatsapp.phone})`
        : '🔴 Disconnected',
    },
    {
      title: 'n8n Status',
      value: data.n8n.online ? '🟢 Online' : '🔴 Offline',
    },
    {
      title: 'Active Automations',
      value: data.activeAutomations,
    },
    {
      title: 'Human Takeovers',
      value: data.humanTakeovers,
    },
    {
      title: 'Messages Today',
      value: data.messagesToday,
    },
    {
      title: 'Failed Automations',
      value: data.failedAutomations,
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border bg-white p-5 shadow"
          >
            <div className="text-sm text-gray-500">{card.title}</div>

            <div className="mt-3 text-xl font-semibold">
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}