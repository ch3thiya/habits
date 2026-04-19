import { getHabitsData } from '@/app/actions/habits';
import DashboardClient from '@/components/DashboardClient';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getHabitsData();

  return (
    <main className="min-h-screen bg-neutral-950 p-6 md:p-12 selection:bg-neutral-800">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-neutral-900 pb-4 mb-10 gap-2">
          <div className="flex items-center gap-2">
            <Image src="/heart red.webp" alt="Heart" width={20} height={20} className="w-6 h-6 opacity-100 block" unoptimized />
            <h1 className="text-xl font-medium text-neutral-200 tracking-tight">Habits</h1>
          </div>
          <p className="text-neutral-500 text-sm tracking-wide mix-blend-plus-lighter">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</p>
        </header>
        
        <DashboardClient initialHabits={data || []} />
      </div>
    </main>
  );
}
