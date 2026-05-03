import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function CalendarPicker({ 
  value, 
  onChange, 
  onClose,
}: { 
  value: Date | null, 
  onChange: (d: Date | null) => void,
  onClose: () => void
}) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  // Get weekday offset for the first day of the month (0 = Sunday, 1 = Monday...)
  const firstDayOffset = start.getDay();
  // We'll pad the array with nulls to align the calendar
  const paddingBefore = Array.from({ length: firstDayOffset }).map(() => null);

  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
      />
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 w-[280px] shadow-xl text-neutral-200 z-50 relative">
        <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={handlePrevMonth} className="text-neutral-500 hover:text-neutral-300 p-1">
          <ChevronLeft size={16} />
        </button>
        <span className="font-medium text-sm">{format(currentMonth, 'MMMM yyyy')}</span>
        <button type="button" onClick={handleNextMonth} className="text-neutral-500 hover:text-neutral-300 p-1">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-neutral-500">
        {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {paddingBefore.map((_, i) => (
          <div key={`padding-${i}`} />
        ))}
        {days.map((day) => {
          const isSelected = value && isSameDay(day, value);
          const isCurrentDay = isToday(day);
          
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                onChange(day);
                onClose();
              }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-colors",
                isSelected ? "bg-neutral-200 text-neutral-900 font-medium shadow-sm" : 
                isCurrentDay ? "bg-neutral-800 text-neutral-200" :
                "hover:bg-neutral-800/80 text-neutral-400"
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-neutral-800/50 flex justify-between">
        <button 
          type="button"
          onClick={() => { onChange(null); onClose(); }} 
          className="text-xs text-neutral-500 hover:text-red-400/80 transition-colors"
        >
          Clear
        </button>
        <button 
          type="button"
          onClick={onClose} 
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}