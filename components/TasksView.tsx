'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus, Trash2, CheckCircle2, GripVertical, Calendar, CalendarX, X } from 'lucide-react';
import { addTask, updateTaskTitle, updateTaskDeadline, updateTaskOrder, deleteTask } from '@/app/actions/tasks';
import { CalendarPicker } from './CalendarPicker';

function TaskItem({ 
  task, 
  onDeleteRequest, 
  onUpdateTitle,
  onUpdateDeadline
}: { 
  task: Task; 
  onDeleteRequest: (id: string, title: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateDeadline: (id: string, deadline: string | null) => void;
}) {
  const controls = useDragControls();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Format date helper
  const getDeadlineText = (deadline: string | null) => {
    if (!deadline) return null;
    const d = parseISO(deadline);
    if (isToday(d)) return <span className="text-amber-500">Today</span>;
    if (isTomorrow(d)) return <span className="text-neutral-400">Tomorrow</span>;
    if (isPast(d)) return <span className="text-red-500">Overdue</span>;
    return <span className="text-neutral-500">{format(d, 'MMM d')}</span>;
  };

  return (
    <Reorder.Item 
      value={task}
      id={task.id}
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      dragListener={false}
      dragControls={controls}
      style={{ listStyle: 'none' }}
      className="group flex items-center justify-between gap-4 p-4 border-b border-neutral-900/50 hover:border-neutral-800 transition-colors bg-neutral-950/30 first:rounded-t-xl last:rounded-b-xl"
    >
      <div className="flex flex-1 items-center gap-3">
        <div 
          className="cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical size={14} />
        </div>
        
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onDeleteRequest(task.id, task.title)}
          className="w-5 h-5 rounded-[4px] border border-neutral-600 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-200 flex items-center justify-center cursor-pointer flex-shrink-0 group/btn"
          title="Mark Done"
        >
          <CheckCircle2 size={12} className="opacity-0 group-hover/btn:opacity-100 text-emerald-500 transition-opacity" strokeWidth={3} />
        </motion.button>
        
        <div className="flex flex-col flex-1 min-w-0">
          {editingTitle ? (
            <input
              autoFocus
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => {
                setEditingTitle(false);
                if (titleValue !== task.title) onUpdateTitle(task.id, titleValue);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingTitle(false);
                  if (titleValue !== task.title) onUpdateTitle(task.id, titleValue);
                } else if (e.key === 'Escape') {
                  setEditingTitle(false);
                  setTitleValue(task.title);
                }
              }}
              className="bg-transparent border-b border-neutral-700 text-neutral-200 outline-none w-full font-medium py-0.5"
            />
          ) : (
            <span 
              className={cn("font-medium text-neutral-200 cursor-pointer select-none truncate")}
              onDoubleClick={() => setEditingTitle(true)}
            >
              {task.title}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0 relative">
        <button 
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="flex items-center gap-1.5 text-xs focus:outline-none z-10"
        >
          {task.deadline ? (
            <>
              <Calendar size={13} className="text-neutral-500" />
              {getDeadlineText(task.deadline)}
            </>
          ) : (
            <span className="opacity-0 sm:group-hover:opacity-100 flex items-center gap-1 text-neutral-600 hover:text-neutral-400 transition-opacity">
              <CalendarX size={13} />
              <span>Set</span>
            </span>
          )}
        </button>

        {/* Custom Calendar Dropdown */}
        <AnimatePresence>
          {isCalendarOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-8 top-8 z-50 shadow-2xl"
            >
              <CalendarPicker 
                value={task.deadline ? new Date(task.deadline) : null} 
                onChange={(d) => onUpdateDeadline(task.id, d ? format(d, 'yyyy-MM-dd') : null)}
                onClose={() => setIsCalendarOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => onDeleteRequest(task.id, task.title)} 
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-neutral-600 hover:text-red-900/80 transition-all ml-2"
          title="Delete permanent"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Reorder.Item>
  );
}

export default function TasksView({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [isAdding, setIsAdding] = useState(false);
  const [addingTitle, setAddingTitle] = useState('');
  const [addingDeadline, setAddingDeadline] = useState<Date | null>(null);
  const [isAddingCalendarOpen, setIsAddingCalendarOpen] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState<{ id: string, title: string } | null>(null);

  useEffect(() => setTasks(initialTasks), [initialTasks]);

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

  const handleReorder = async (reordered: Task[]) => {
    setTasks(reordered);
    await updateTaskOrder(reordered.map((t, i) => ({ id: t.id, display_order: i })));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingTitle.trim()) return;
    
    const deadlineStr = addingDeadline ? format(addingDeadline, 'yyyy-MM-dd') : null;
    const tempId = `temp-${Date.now()}`;
    const newTask: Task = { 
      id: tempId, 
      title: addingTitle.trim(), 
      deadline: deadlineStr, 
      created_at: new Date().toISOString() 
    };
    
    const sorted = [...tasks, newTask].sort((a, b) => {
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return 0;
    });
    setTasks(sorted);

    setAddingTitle('');
    setAddingDeadline(null);
    setIsAdding(false);
    setIsAddingCalendarOpen(false);
    
    await addTask(newTask.title, newTask.deadline);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
    await deleteTask(taskToDelete.id);
    setTaskToDelete(null);
  };

  const handleUpdateTitle = async (id: string, title: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title } : t));
    await updateTaskTitle(id, title);
  };

  const handleUpdateDeadline = async (id: string, deadline: string | null) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, deadline } : t);
      return updated.sort((a, b) => {
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        return 0;
      });
    });
    await updateTaskDeadline(id, deadline);
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-neutral-300">Tasks</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="text-neutral-300 hover:bg-neutral-800 transition-colors text-xs flex items-center gap-1 self-start sm:self-auto border border-neutral-700 px-3 py-1.5 rounded-md"
        >
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Pop-up modal for task adding */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full max-w-sm flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-neutral-200 font-medium">New Task</h3>
                <button onClick={() => setIsAdding(false)} className="text-neutral-500 hover:text-neutral-300">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="flex flex-col gap-4 relative">
                <input 
                  type="text"
                  autoFocus
                  placeholder="Task title..."
                  value={addingTitle}
                  onChange={(e) => setAddingTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-neutral-200 outline-none focus:border-neutral-600 transition-colors"
                />
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setIsAddingCalendarOpen(!isAddingCalendarOpen)}
                      className="px-4 py-2.5 rounded-lg border border-neutral-800 bg-neutral-950 text-neutral-300 text-sm flex items-center gap-2 hover:border-neutral-600 transition-colors"
                    >
                      <Calendar size={14} />
                      {addingDeadline ? format(addingDeadline, 'MMM d, yyyy') : 'Any time'}
                    </button>

                    {isAddingCalendarOpen && (
                      <div className="absolute top-12 left-0 z-50">
                        <CalendarPicker 
                          value={addingDeadline} 
                          onChange={(d) => setAddingDeadline(d)} 
                          onClose={() => setIsAddingCalendarOpen(false)} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={!addingTitle.trim()}
                    className="w-full bg-neutral-200 text-neutral-900 font-medium py-2.5 rounded-lg hover:bg-neutral-300 transition-colors disabled:opacity-50"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pop-up modal for task deletion */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-red-900/30 p-6 rounded-xl w-full max-w-sm flex flex-col gap-6"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-neutral-200 font-medium text-lg">Remove Task?</h3>
                <p className="text-neutral-500 text-sm">
                  Are you sure you want to completely remove "{taskToDelete.title}"? This will delete it permanently.
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setTaskToDelete(null)}
                  className="flex-1 bg-neutral-800 text-neutral-300 font-medium py-2.5 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteTask}
                  className="flex-1 bg-red-900/80 text-red-100 font-medium py-2.5 rounded-lg hover:bg-red-800 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-neutral-950/30 rounded-xl border border-neutral-900/50">
        {tasks.length === 0 && (
           <div className="text-neutral-600 text-sm py-8 px-6 italic text-center">No tasks. Enjoy your day!</div>
        )}
        <Reorder.Group 
          axis="y" 
          values={tasks} 
          onReorder={handleReorder} 
          className="flex flex-col"
        >
          <AnimatePresence mode="popLayout">
            {tasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onDeleteRequest={(id, title) => setTaskToDelete({id, title})}
                onUpdateTitle={handleUpdateTitle}
                onUpdateDeadline={handleUpdateDeadline}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>
    </div>
  );
}
