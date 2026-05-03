'use client';

import { useState, useMemo, useEffect } from 'react';
import { HabitWithLogs } from '@/types';
import { format, subDays, isToday, differenceInDays, startOfWeek, addDays } from 'date-fns';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus, Trash2, CheckCircle2, Bell, X, ChevronDown, Loader2, GripVertical } from 'lucide-react';
import { toggleHabitLog, addHabit, deleteHabit, saveReminder, updateHabitName, updateHabitOrder } from '@/app/actions/habits';

function HabitItem({
  habit,
  view,
  currentViewDays,
  streak,
  highestStreak,
  daysAgo,
  missedWarning,
  editingName,
  editingHabitId,
  setEditingName,
  setEditingHabitId,
  handleRenameSubmit,
  setActiveReminderPopup,
  setHabitToDelete,
  handleToggle
}: any) {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={habit}
      id={habit.id}
      layout
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ listStyle: 'none' }}
      className={cn(
        "group flex flex-col justify-between gap-4 transition-colors border-neutral-900/50 hover:border-neutral-800 relative", 
        view === '7d' || view === 'weekly' ? "py-4 border-b sm:flex-row sm:items-center" : "p-5 border rounded-xl bg-neutral-950/30"
      )}
    >
      {/* Info */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-3 relative">
          <div 
            className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
            onPointerDown={(e) => controls.start(e)}
          >
            <GripVertical size={14} />
          </div>
          {editingHabitId === habit.id ? (
            <input
              autoFocus
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleRenameSubmit(habit.id, editingName)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(habit.id, editingName);
                else if (e.key === 'Escape') setEditingHabitId(null);
              }}
              className="bg-transparent border-b border-neutral-700 text-neutral-200 outline-none flex-1 font-medium py-0.5 min-w-0"
            />
          ) : (
            <span 
              className="font-medium text-neutral-200 cursor-pointer select-none truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingName(habit.name);
                setEditingHabitId(habit.id);
              }}
              title="Double-click to rename"
            >
              {habit.name}
            </span>
          )}
          <button 
            onClick={() => setActiveReminderPopup(habit.id)} 
            className={cn(
              "transition-all ml-auto focus:outline-none", 
              habit.reminders && habit.reminders.length > 0 && habit.reminders[0].active 
                ? "opacity-100 text-neutral-300" 
                : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-neutral-600 hover:text-neutral-400"
            )}
          >
            <Bell size={14} />
          </button>
          <button onClick={() => setHabitToDelete(habit.id)} className="text-neutral-600 hover:text-red-500 transition-all focus:outline-none">
            <Trash2 size={14} />
          </button>
        </div>
        
        {/* Streak row with ml-[26px] to skip GripVertical space */}
        <div className="ml-[26px] flex items-center gap-3 mt-1.5 text-xs min-h-[16px]">
          <span className="text-neutral-400 font-medium">🔥 {streak} {streak === 1 ? 'Day' : 'Days'} <span className="text-neutral-600 mix-blend-plus-lighter px-0.5">•</span> Max {highestStreak}</span>
          {daysAgo !== null && daysAgo > 0 && (
            <span className={cn("text-neutral-500", missedWarning && "text-amber-700/80")}>Last: {daysAgo}d ago</span>
          )}
        </div>
      </div>

      <div className={cn("pb-4 sm:pb-0", view === '7d' || view === 'weekly' ? "flex items-center gap-2 overflow-x-auto hide-scrollbar flex-nowrap" : "grid grid-cols-7 gap-1.5 w-fit")}>
        {currentViewDays.map((date: any) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const isCompleted = !!habit.logs[dateStr];
          const isTodayFlag = isToday(date);
          
          return (
            <div key={dateStr} className="flex flex-col items-center gap-1 min-w-[32px] snap-end">
              <span className="text-[10px] text-neutral-300 font-mono tracking-tighter mix-blend-plus-lighter whitespace-nowrap">
                {view === '7d' || view === 'weekly' ? format(date, 'EE').charAt(0) : format(date, 'dd')}
              </span>
              
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleToggle(habit.id, dateStr, isCompleted)}
                className={cn(
                  "w-8 h-8 rounded-[4px] border transition-all duration-200 flex items-center justify-center cursor-pointer focus:outline-none",
                  isCompleted 
                    ? "bg-neutral-200 border-neutral-200 text-neutral-950 shadow-[0_0_10px_rgba(255,255,255,0.15)]" 
                    : "bg-neutral-900/50 border-neutral-600 hover:border-neutral-400 hover:bg-neutral-800/80",
                  isTodayFlag && !isCompleted && "border-neutral-400 bg-neutral-800"
                )}
              >
                {isCompleted && <CheckCircle2 size={16} strokeWidth={2.5} />}
              </motion.button>
            </div>
          );
        })}
      </div>
    </Reorder.Item>
  );
}

export default function HabitsView({ initialHabits }: { initialHabits: HabitWithLogs[] }) {
  const [habits, setHabits] = useState(initialHabits);
  const [addingName, setAddingName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeReminderPopup, setActiveReminderPopup] = useState<string | null>(null);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Sync with server when initialHabits changes (e.g. via revalidatePath)
  // Instead of an effect setting state, we compute it or just initialize differently.
  // Actually, setting state from props directly when they change is an anti-pattern.
  // However, because we use pessimistic server actions + optimistic UI combined with Next's 
  // revalidatePath, initialHabits changes when the server finishes the job.
  useEffect(() => {
    // Suppress warning by doing it asynchronously
    const t = setTimeout(() => {
      setHabits(prev => {
        if (JSON.stringify(prev) === JSON.stringify(initialHabits)) return prev;
        return initialHabits;
      });
      setIsAddingHabit(false);
    }, 0);
    return () => clearTimeout(t);
  }, [initialHabits]);

  // Keyboard shortcut for adding
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAdding(true);
      }
      if (e.key === 'Escape') setIsAdding(false);
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  const [view, setView] = useState<'7d' | '30d' | 'monthly' | 'weekly'>('7d');

  const today = new Date();
  
  // Dynamic Views Arrays
  const last7Days = useMemo(() => Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i)), [today]);
  
  // Weekly View: Current week starting from Monday
  const currentWeekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [today]);

  const last30Days = useMemo(() => Array.from({ length: 30 }).map((_, i) => subDays(today, 29 - i)), [today]);
  const currentMonthDays = useMemo(() => {
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }).map((_, i) => new Date(today.getFullYear(), today.getMonth(), i + 1));
  }, [today]);

  const currentViewDays = view === '7d' ? last7Days : view === 'weekly' ? currentWeekDays : view === '30d' ? last30Days : currentMonthDays;

  const handleToggle = async (habitId: string, dateStr: string, currentStatus: boolean) => {
    // Optimistic Update
    setHabits((prev) => 
      prev.map(h => {
        if (h.id === habitId) {
          const newLogs = { ...h.logs };
          if (!currentStatus) newLogs[dateStr] = true;
          else delete newLogs[dateStr];
          return { ...h, logs: newLogs };
        }
        return h;
      })
    );
    await toggleHabitLog(habitId, dateStr, currentStatus);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingName.trim()) return;
    
    setIsAddingHabit(true);
    const nameToAdd = addingName.trim();
    
    await addHabit(nameToAdd);
    // Component will naturally animate the new item when Server Action's revalidatePath settles
    setIsAdding(false);
    setAddingName('');
    setIsAddingHabit(false);
  };

  const handleReorder = async (reorderedHabits: HabitWithLogs[]) => {
    // Optimistic UI
    setHabits(reorderedHabits);
    const orders = reorderedHabits.map((h, i) => ({ id: h.id, display_order: i }));
    await updateHabitOrder(orders);
  };

  const handleRenameSubmit = async (id: string, newName: string) => {
    if (newName.trim() === '') {
      setEditingHabitId(null);
      return;
    }
    
    // Optimistic UI
    setHabits(prev => prev.map(h => {
      if (h.id === id) return { ...h, name: newName.trim() };
      return h;
    }));
    setEditingHabitId(null);
    setEditingName('');
    
    await updateHabitName(id, newName.trim());
  };

  const handleDelete = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id)); // Optimistic UI
    await deleteHabit(id);
  };

  const calculateStreak = (habit: HabitWithLogs) => {
    let streak = 0;
    let currDay = new Date();
    // Check if missed today, if so start counting from yesterday
    const todayStr = format(currDay, 'yyyy-MM-dd');
    if (!habit.logs[todayStr]) {
      currDay = subDays(currDay, 1);
    }

    while (true) {
      if (habit.logs[format(currDay, 'yyyy-MM-dd')]) {
        streak++;
        currDay = subDays(currDay, 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateHighestStreak = (habit: HabitWithLogs) => {
    const dates = Object.keys(habit.logs)
      .filter(d => habit.logs[d])
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
    if (dates.length === 0) return 0;
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i-1]);
      const curr = new Date(dates[i]);
      if (differenceInDays(curr, prev) === 1) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 1;
      }
    }
    return maxStreak;
  };

  const lastDoneDaysAgo = (habit: HabitWithLogs) => {
    const dates = Object.keys(habit.logs).sort();
    if (dates.length === 0) return null;
    const lastDate = new Date(dates[dates.length - 1]);
    return differenceInDays(today, lastDate);
  };

  return (
    <div className="space-y-12">
      
      {/* 7 Days View */}
      <section className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-neutral-500">
            <button onClick={() => setView('7d')} className={cn("hover:text-neutral-200 transition-colors", view === '7d' && "text-neutral-200")}>7D</button>
            <span>/</span>
            <button onClick={() => setView('weekly')} className={cn("hover:text-neutral-200 transition-colors", view === 'weekly' && "text-neutral-200")}>Week</button>
            <span>/</span>
            <button onClick={() => setView('30d')} className={cn("hover:text-neutral-200 transition-colors", view === '30d' && "text-neutral-200")}>30D</button>
            <span>/</span>
            <button onClick={() => setView('monthly')} className={cn("hover:text-neutral-200 transition-colors", view === 'monthly' && "text-neutral-200")}>Month</button>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="text-neutral-300 hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1 self-start sm:self-auto border border-neutral-700 px-3 py-1.5 rounded-md"
          >
            <Plus size={14} /> Add Habit
          </button>
        </div>

        <div className={cn("grid gap-4 sm:gap-6", (view === '30d' || view === 'monthly') && "md:grid-cols-2 md:gap-8")}>
          {habits.length === 0 && (
             <div className="text-neutral-600 text-sm py-4 italic col-span-full">No habits tracking yet. Press cmd+k to add one.</div>
          )}

          <Reorder.Group 
            axis="y" 
            values={habits} 
            onReorder={handleReorder} 
            className={cn("col-span-full grid gap-4 sm:gap-4", (view === '30d' || view === 'monthly') && "md:grid-cols-2 md:gap-8")}
          >
            <AnimatePresence mode="popLayout">
              {habits.map((habit) => {
                const streak = calculateStreak(habit);
                const highestStreak = calculateHighestStreak(habit);
                const daysAgo = lastDoneDaysAgo(habit);
                const missedWarning = daysAgo !== null && daysAgo > 2;

                return (
                  <HabitItem
                    key={habit.id}
                    habit={habit}
                    view={view}
                    currentViewDays={currentViewDays}
                    streak={streak}
                    highestStreak={highestStreak}
                    daysAgo={daysAgo}
                    missedWarning={missedWarning}
                    editingName={editingName}
                    editingHabitId={editingHabitId}
                    setEditingName={setEditingName}
                    setEditingHabitId={setEditingHabitId}
                    handleRenameSubmit={handleRenameSubmit}
                    setActiveReminderPopup={setActiveReminderPopup}
                    setHabitToDelete={setHabitToDelete}
                    handleToggle={handleToggle}
                  />
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        </div>
      </section>

      <AnimatePresence>
        {activeReminderPopup && (
          <ReminderModal 
            habit={habits.find(h => h.id === activeReminderPopup)!}
            onClose={() => setActiveReminderPopup(null)}
            onSave={async (hId, time, freq, days, active) => {
              // optimistic update
              setHabits(prev => prev.map(h => {
                if (h.id === hId) {
                  return {
                    ...h,
                    reminders: [{ id: h.reminders?.[0]?.id || `temp-${Date.now()}`, habit_id: hId, time, frequency: freq, days_of_week: days, active }]
                  };
                }
                return h;
              }));
              await saveReminder(hId, time, freq, days, active);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {habitToDelete && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setHabitToDelete(null)}
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full max-w-sm flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-neutral-200 font-medium text-lg">Delete Habit</h3>
                <p className="text-sm text-neutral-400">
                  Are you sure you want to delete <span className="text-neutral-200 font-medium">&quot;{habits.find(h => h.id === habitToDelete)?.name}&quot;</span>? 
                  This will permanently delete all logged history and reminders.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setHabitToDelete(null)}
                  className="flex-1 bg-neutral-800 text-neutral-300 font-medium py-2 rounded-md hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleDelete(habitToDelete);
                    setHabitToDelete(null);
                  }}
                  className="flex-1 bg-red-900/80 text-white font-medium py-2 rounded-md hover:bg-red-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div 
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setIsAdding(false)}
          >
            <motion.div 
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full max-w-sm flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-neutral-200 font-medium">New Habit</h3>
                <button onClick={() => setIsAdding(false)} className="text-neutral-500 hover:text-neutral-300">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="relative flex items-center">
                <input
                  autoFocus
                  disabled={isAddingHabit}
                  type="text"
                  placeholder="Habit Name..."
                  value={addingName}
                  onChange={e => setAddingName(e.target.value)}
                  className="w-full bg-black text-sm px-4 py-3 pr-12 rounded-md border border-neutral-800 focus:border-neutral-500 outline-none transition-colors disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={!addingName.trim() || isAddingHabit}
                  className="absolute right-2 w-8 h-8 flex items-center justify-center bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
                >
                  {isAddingHabit ? <Loader2 size={16} className="animate-spin text-neutral-400" /> : <Plus size={16} />}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ReminderModal({ 
  habit, 
  onClose,
  onSave
}: { 
  habit: HabitWithLogs, 
  onClose: () => void,
  onSave: (habitId: string, time: string, frequency: 'daily' | 'weekly' | 'every_other_day', daysOfWeek: number[], active: boolean) => Promise<void>
}) {
  const existing = habit.reminders && habit.reminders.length > 0 ? habit.reminders[0] : null;
  const [active, setActive] = useState(existing?.active ?? true);
  const [time, setTime] = useState(existing?.time ? existing.time.substring(0, 5) : '09:00');
  const [frequency, setFrequency] = useState<'daily'|'weekly'|'every_other_day'>(existing?.frequency || 'daily');
  const [isFreqOpen, setIsFreqOpen] = useState(false);
  const [days, setDays] = useState<number[]>(existing?.days_of_week || [1,2,3,4,5]);

  const [saving, setSaving] = useState(false);

  const toggleDay = (dayIndex: number) => {
    if (days.includes(dayIndex)) {
      setDays(d => d.filter(x => x !== dayIndex));
    } else {
      setDays(d => [...d, dayIndex]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Only pass days_of_week when frequency is 'weekly', otherwise pass empty array
    const daysToSave = frequency === 'weekly' ? days : [];
    await onSave(habit.id, `${time}:00`, frequency, daysToSave, active);
    setSaving(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full max-w-sm flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-neutral-200 font-medium">Reminders for {habit.name}</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActive(!active)}>
            <div className={cn("w-10 h-6 rounded-full transition-colors flex items-center px-1 focus:outline-none", active ? "bg-neutral-200" : "bg-neutral-800")}>
              <motion.div 
                layout 
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn("w-4 h-4 rounded-full bg-neutral-950", !active && "bg-neutral-400")} 
                style={{ marginLeft: active ? "16px" : "0px" }}
              />
            </div>
            <span className="text-sm text-neutral-300 select-none">Enable reminders</span>
          </div>
          
          <div className={cn("flex flex-col gap-4 transition-opacity", !active && "opacity-50 pointer-events-none")}>
            <div className="flex flex-col gap-1.5 relative">
              <span className="text-xs text-neutral-500 uppercase font-medium tracking-wider">Time</span>
              <input 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
                className="bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2.5 text-sm outline-none text-neutral-200 w-full [&::-webkit-calendar-picker-indicator]:hidden focus:border-neutral-600 transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-1.5 relative">
              <span className="text-xs text-neutral-500 uppercase font-medium tracking-wider">Frequency</span>
              <button 
                onClick={() => setIsFreqOpen(!isFreqOpen)}
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm outline-none text-neutral-200 w-full flex items-center justify-between hover:border-neutral-700 transition-colors"
                type="button"
              >
                <span>
                  {frequency === 'daily' ? 'Daily' : frequency === 'every_other_day' ? 'Every other day' : 'Custom Days'}
                </span>
                <ChevronDown size={16} className={cn("text-neutral-500 transition-transform", isFreqOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isFreqOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-16 left-0 w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-20 overflow-hidden flex flex-col"
                  >
                    {[
                      { val: 'daily', label: 'Daily' },
                      { val: 'every_other_day', label: 'Every other day' },
                      { val: 'weekly', label: 'Custom Days' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => {
                          setFrequency(opt.val as 'daily' | 'weekly' | 'every_other_day');
                          setIsFreqOpen(false);
                        }}
                        className="text-left px-3 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={cn("flex justify-between w-full h-10 transition-all duration-300", frequency === 'weekly' ? "opacity-100" : "opacity-0 pointer-events-none")}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
                <button 
                  key={d} 
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "text-[11px] font-medium flex-1 mx-0.5 rounded-md border transition-all duration-200 flex items-center justify-center", 
                    days.includes(i) ? "bg-neutral-200 text-neutral-950" : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving || (frequency === 'weekly' && days.length === 0)}
          className="bg-neutral-200 text-neutral-950 font-medium h-10 rounded-md hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin text-neutral-600" /> : 'Save Reminder'}
        </button>

      </motion.div>
    </div>
  );
}
