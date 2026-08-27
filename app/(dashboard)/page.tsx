import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { automations } from '@/lib/automations';
import AutomationCard from '@/components/AutomationCard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Welcome back, {session?.user?.name ?? session?.user?.email ?? 'there'}.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {automations.map((automation) => (
          <AutomationCard key={automation.id} automation={automation} />
        ))}
      </div>
    </div>
  );
}
