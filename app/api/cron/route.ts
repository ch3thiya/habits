import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current time in Sri Lanka (IST/GMT+5:30)
    const now = new Date();
    const options = { timeZone: 'Asia/Colombo', hour12: false };
    const lkTimeStr = now.toLocaleString('en-US', options); // "M/D/YYYY, HH:mm:ss"
    const lkDate = new Date(lkTimeStr);

    const currentHour = lkDate.getHours().toString().padStart(2, '0');

    const { data: reminders } = await supabase
      .from('reminders')
      .select('*, habits(*)')
      .eq('active', true);

    // Filter in JavaScript to avoid Postgres type grouping errors on time columns
    const activeReminders = (reminders || []).filter(r => {
      // r.time will be something like "18:10:00"
      return r.time && r.time.startsWith(`${currentHour}:`);
    });

    if (!activeReminders || activeReminders.length === 0) {
      console.log(`[CRON DEBUG] No active reminders found for hour ${currentHour}`);
      return NextResponse.json({ message: 'No reminders to send at this time.' });
    }

    console.log(`[CRON DEBUG] Found ${activeReminders.length} reminders for hour ${currentHour}:`, activeReminders);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Telegram credentials missing.' }, { status: 500 });
    }

    const currentDayOfWeek = lkDate.getDay(); // 0 is Sunday
    // For every other day, we use the Epoch days since Jan 1 1970
    const epochDays = Math.floor(lkDate.getTime() / (1000 * 60 * 60 * 24));

    const sendPromises = activeReminders.filter(reminder => {
      if (reminder.frequency === 'daily') return true;
      if (reminder.frequency === 'every_other_day') {
        // Toggle on/off every alternating day
        return epochDays % 2 === 0;
      }
      if (reminder.frequency === 'weekly' && reminder.days_of_week?.includes(currentDayOfWeek)) return true;
      return false;
    }).map(async (reminder) => {
      const text = `🔔 Reminder: Time to complete "${reminder.habits?.name}"!`;
      
      return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          disable_notification: false
        })
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, count: reminders.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
