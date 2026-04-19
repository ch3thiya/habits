# Minimal Habit Tracker

A minimal, single-user habit tracker built with Next.js (App Router), Tailwind CSS v4, Framer Motion, and Supabase. Features a dark mode UI, optimistic updates, and daily/weekly/custom Telegram bot reminders.

## Features
- **Views**: 7-day, 30-day, weekly, and monthly tracking modes.
- **Custom Schedules**: Remind yourself daily, weekly, or on custom days.
- **Telegram Bot Integration**: Configure personalized times down to the minute to receive habit notifications.
- **Animations**: Silky smooth interactions powered by Framer Motion `layout` props.
- **Auth**: Simple, single-password entry to lock down your personal dashboard.

## Setup
1. Clone the repository
2. Run `npm install`
3. Create a `.env.local` file with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
APP_PASSWORD=your-secure-login-password
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
CRON_SECRET=your-random-cron-secret
```
4. Run `npm run dev` to start locally.

## Deploying & Crons
Host on Vercel by importing your GitHub project. **Note:** Vercel's Free tier limits native crons to once per day. To enable minute-by-minute checking for your specific reminders:
1. Sign up for [cron-job.org](https://cron-job.org)
2. Create a new cron job pointing to `https://your-vercel-app.vercel.app/api/cron`
3. Set the schedule to run every 1 minute.
4. Under "Advanced Configuration", add an HTTP Header: `Authorization` with the value `Bearer your-random-cron-secret`.

*Built for performance, simplicity, and keeping the streak alive!*
