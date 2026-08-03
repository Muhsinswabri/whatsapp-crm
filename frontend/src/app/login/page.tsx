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

const API = process.env.NEXT_PUBLIC_API_URL!;

const DEFAULT_DATA: DashboardStatus = {
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
  const [data, setData] = useState<DashboardStatus>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch(`${API}/dashboard/status`, {
          credentials: 'include',
        });

        if (!res.ok) {
          console.error(
            `Dashboard API Error: ${res.status} ${res.statusText}`
          );
          setData(DEFAULT_DATA);
          return;
        }

        const json = await res.json();

        setData({
          whatsapp: {
            connected: json?.whatsapp?.connected ?? false,
            phone: json?.whatsapp?.phone ?? null,
            session: json?.whatsapp?.session ?? null,
          },
          n8n: {
            online: json?.n8n?.online ?? false,
          },
          activeAutomations: json?.activeAutomations ?? 0,
          humanTakeovers: json?.humanTakeovers ?? 0,
          messagesToday: json?.messagesToday ?? 0,
          failedAutomations: json?.failedAutomations ?? 0,
        });
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-lg font-medium">
        Loading dashboard...
      </div>
    );
  }

  const cards = [
    {
      title: 'WhatsApp Connection',
      value: data.whatsapp.connected
        ? `🟢 Connected (${data.whatsapp.phone ?? 'Unknown'})`
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-500">
          Operational health overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border bg-white p-5 shadow-sm"
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