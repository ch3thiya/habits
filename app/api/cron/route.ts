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
    const lkTimeStr = now.toLocaleString('en-US', options); // "4/19/2026, 18:15:30"
    
    // Extract hour from the formatted string
    // Format is "M/D/YYYY, HH:mm:ss"
    const parts = lkTimeStr.split(', ')[1].split(':'); // ["18", "15", "30"]
    const currentHour = parts[0].padStart(2, '0');

    const { data: reminders } = await supabase
      .from('reminders')
      .select('*, habits(*)')
      .eq('active', true)
      .like('time', `${currentHour}:%`);

    if (!reminders || reminders.length === 0) {
      console.log(`[CRON DEBUG] No active reminders found for hour ${currentHour} (LK time)`);
      return NextResponse.json({ message: 'No reminders to send at this time.' });
    }

    console.log(`[CRON DEBUG] Found ${reminders.length} reminders for hour ${currentHour}:`, reminders);

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Telegram credentials missing.' }, { status: 500 });
    }

    // Get day of week for weekly reminders (0 = Sunday in JS)
    // We need to get this from the LK timezone too
    const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Colombo', weekday: 'long' });
    const dayName = dayFormatter.format(now);
    const dayMap: Record<string, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const currentDayOfWeek = dayMap[dayName];
    
    // For every other day, we use the Epoch days since Jan 1 1970 in LK timezone
    const lkDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
    const epochDays = Math.floor(lkDate.getTime() / (1000 * 60 * 60 * 24));

    const sendPromises = reminders.filter(reminder => {
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
