-- Run this in your Supabase SQL Editor

-- Create habits table
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Create habit logs table
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  UNIQUE(habit_id, date)
);

-- Create reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  time TIME NOT NULL,
  active BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'daily',
  days_of_week INTEGER[] DEFAULT '{}'
);

-- Set up Row Level Security (RLS)
-- Since it's a single user app with password protection on the Next.js side,
-- we can allow anonymous access IF you only use the anon key on the server 
-- OR restrict via RLS and a custom token. 
-- For simplicity in a single-user self-hosted app, we can just allow all 
-- since the App is protected by the Next.js middleware.
-- WARNING: In a real public deployment, ensure your Supabase endpoint is secured properly.
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to habits" ON habits FOR ALL USING (true);
CREATE POLICY "Allow all access to habit_logs" ON habit_logs FOR ALL USING (true);
CREATE POLICY "Allow all access to reminders" ON reminders FOR ALL USING (true);
