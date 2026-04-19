'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Habit, HabitLog, HabitWithLogs, Reminder } from '@/types';
import { format, subDays } from 'date-fns';

export async function getHabitsData(): Promise<HabitWithLogs[]> {
  const [{ data: habits }, { data: logs }, { data: reminders }] = await Promise.all([
    supabase.from('habits').select('*').order('created_at', { ascending: true }),
    supabase.from('habit_logs').select('*'),
    supabase.from('reminders').select('*'),
  ]);

  if (!habits) return [];

  return habits.map((habit: Habit) => {
    // Collect last ~60 days for logs map
    const habitLogs = (logs || []).filter((log: HabitLog) => log.habit_id === habit.id);
    const logsMap: Record<string, boolean> = {};
    habitLogs.forEach((log) => {
      logsMap[log.date] = log.completed;
    });

    return {
      ...habit,
      logs: logsMap,
      reminders: (reminders || []).filter((r: Reminder) => r.habit_id === habit.id),
    };
  });
}

export async function addHabit(name: string) {
  if (!name.trim()) return;
  await supabase.from('habits').insert({ name: name.trim() });
  revalidatePath('/');
}

export async function deleteHabit(id: string) {
  await supabase.from('habits').delete().eq('id', id);
  revalidatePath('/');
}

export async function saveReminder(habitId: string, time: string, frequency: 'daily' | 'weekly' | 'every_other_day', daysOfWeek: number[], active: boolean) {
  // We'll just upsert: if one exists for the habit, update it. For minimum single-user usage, 1 reminder per habit is enough.
  const { data: existing } = await supabase.from('reminders').select('id').eq('habit_id', habitId).single();
  
  if (existing) {
    await supabase.from('reminders').update({ time, frequency, days_of_week: daysOfWeek, active }).eq('id', existing.id);
  } else {
    await supabase.from('reminders').insert({ habit_id: habitId, time, frequency, days_of_week: daysOfWeek, active });
  }
  revalidatePath('/');
}

export async function toggleHabitLog(habitId: string, date: string, currentStatus: boolean) {
  if (currentStatus) {
    // Delete log
    await supabase.from('habit_logs').delete().match({ habit_id: habitId, date });
  } else {
    // Insert/Update log
    await supabase.from('habit_logs').upsert(
      { habit_id: habitId, date, completed: true },
      { onConflict: 'habit_id, date' }
    );
  }
  revalidatePath('/');
}

// Telegram webhook/test endpoint would go here
export async function testTelegramNotification() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) return { error: 'Telegram keys missing' };

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'Test Notification from Habit Tracker.',
        disable_notification: true
      })
    });
    return { success: true };
  } catch (error) {
    return { error: 'Failed to send' };
  }
}
