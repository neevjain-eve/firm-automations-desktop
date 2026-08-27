import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

// Full-screen layout for the literally-copied tracker apps (Status Tracker,
// EL Tracker, To-Do List, e-Signature). Unlike the rest of the dashboard,
// these pages get no sidebar/header chrome -- they fill the whole browser
// window, exactly like visiting the original standalone GitHub Pages sites
// did. Still gated by the same Firm Automations login as everything else;
// this route group only changes the visual wrapper, not the auth boundary.
export default async function LegacyLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  return <div style={{ minHeight: '100vh', background: '#fff' }}>{children}</div>;
}
