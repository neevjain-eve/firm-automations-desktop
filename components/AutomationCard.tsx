import Link from 'next/link';
import { Automation } from '@/lib/automations';

export default function AutomationCard({ automation }: { automation: Automation }) {
  const isLive = automation.status === 'live';

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{automation.name}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isLive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isLive ? 'Live' : 'Coming soon'}
          </span>
        </div>
        <p className="text-sm text-slate-500">{automation.description}</p>
      </div>
      {isLive ? (
        <Link
          href={automation.href ?? `/automations/${automation.id}`}
          className="mt-4 inline-block rounded-lg bg-slate-900 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-slate-700"
        >
          Open
        </Link>
      ) : (
        <button
          disabled
          className="mt-4 cursor-not-allowed rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-400"
        >
          Open
        </button>
      )}
    </div>
  );
}
