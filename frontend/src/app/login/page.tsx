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

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://whatsapp-crm-faev.onrender.com/api';

const EMPTY: DashboardStatus = {
  whatsapp: {
    connected: false,
    phone: null,
    session: null,
  },
  n8n: {
    online: false,
  },
  activeAutomations: 0,
  humanTakeovers: 0,
  messagesToday: 0,
  failedAutomations: 0,
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStatus>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/dashboard/status`, {
          credentials: 'include',
        });

        if (!res.ok) {
          console.error('Dashboard API:', res.status);
          setData(EMPTY);
          return;
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setData(EMPTY);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const cards = [
    {
      title: 'WhatsApp Connection',
      value: data.whatsapp.connected
        ? `🟢 Connected (${data.whatsapp.phone ?? ''})`
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border bg-white p-5 shadow"
          >
            <div className="text-sm text-gray-500">
              {card.title}
            </div>

            <div className="mt-3 text-xl font-semibold">
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}