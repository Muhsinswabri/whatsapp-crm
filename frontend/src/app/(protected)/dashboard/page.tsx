export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-gray-900">Dashboard</h1>
      <p className="mb-6 text-sm text-gray-500">
        Operational health overview. Live cards (WhatsApp connection, n8n status, active
        automations, human takeovers, messages today, failed automations) are wired up in the
        monitoring stage.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {['WhatsApp Connection', 'n8n Status', 'Active Automations', 'Human Takeovers', 'Messages Today', 'Failed Automations'].map(
          (label) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-400">—</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
