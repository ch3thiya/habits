export type Habit = {
  id: string;
  name: string;
  created_at: string;
  display_order?: number;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
};

export type Reminder = {
  id: string;
  habit_id: string;
  time: string; // HH:mm:ss
  active: boolean;
  frequency: 'daily' | 'weekly' | 'every_other_day';
  days_of_week?: number[]; // 0-6 where 0 is Sunday
};

export type HabitWithLogs = Habit & {
  logs: Record<string, boolean>; // map of date (YYYY-MM-DD) to completed status
  reminders: Reminder[];
};

export type Task = {
  id: string;
  title: string;
  deadline: string | null; // YYYY-MM-DD
  display_order?: number;
  created_at: string;
};

export type Journal = {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};
