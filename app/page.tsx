import { getHabitsData } from '@/app/actions/habits';
import { getTasksData } from '@/app/actions/tasks';
import { getJournalsData } from '@/app/actions/journals';
import DashboardClient from '@/components/DashboardClient';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [habitsData, tasksData, journalsData] = await Promise.all([
    getHabitsData(),
    getTasksData(),
    getJournalsData()
  ]);

  return (
    <main className="min-h-screen bg-neutral-950 p-6 md:p-12 selection:bg-neutral-800">
      <div className="max-w-4xl mx-auto">        
        <DashboardClient 
          initialHabits={habitsData || []} 
          initialTasks={tasksData || []} 
          initialJournals={journalsData || []} 
        />
      </div>
    </main>
  );
}
