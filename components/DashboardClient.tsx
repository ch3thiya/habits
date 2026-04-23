'use client';

import { useState } from 'react';
import { HabitWithLogs, Task, Journal } from '@/types';
import HabitsView from './HabitsView';
import TasksView from './TasksView';
import JournalView from './JournalView';
import { cn } from '@/lib/utils';
import { CheckSquare, Type, ListTodo } from 'lucide-react';

export default function DashboardClient({ 
  initialHabits,
  initialTasks,
  initialJournals
}: { 
  initialHabits: HabitWithLogs[];
  initialTasks: Task[];
  initialJournals: Journal[];
}) {
  const [activeTab, setActiveTab] = useState<'habits' | 'tasks' | 'journal'>('habits');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex bg-neutral-900/50 p-1 rounded-lg w-fit mb-8 border border-neutral-800/80 mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('habits')}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
            activeTab === 'habits' 
              ? "bg-neutral-800 text-neutral-200 shadow-sm" 
              : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <CheckSquare size={16} /> Habits
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
            activeTab === 'tasks' 
              ? "bg-neutral-800 text-neutral-200 shadow-sm" 
              : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <ListTodo size={16} /> Tasks
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
            activeTab === 'journal' 
              ? "bg-neutral-800 text-neutral-200 shadow-sm" 
              : "text-neutral-500 hover:text-neutral-300"
          )}
        >
          <Type size={16} /> Journal
        </button>
      </div>

      <div className="relative">
        {activeTab === 'habits' && <HabitsView initialHabits={initialHabits} />}
        {activeTab === 'tasks' && <TasksView initialTasks={initialTasks} />}
        {activeTab === 'journal' && <JournalView initialJournals={initialJournals} />}
      </div>
    </div>
  );
}
