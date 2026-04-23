'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Task } from '@/types';

export async function getTasksData(): Promise<Task[]> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    // nulls first false means tasks with no deadline go to the bottom
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  return tasks || [];
}

export async function addTask(title: string, deadline: string | null = null) {
  if (!title.trim()) return;
  const insertData: any = { title: title.trim() };
  if (deadline) insertData.deadline = deadline;
  
  await supabase.from('tasks').insert(insertData);
  revalidatePath('/');
}

export async function updateTaskTitle(id: string, title: string) {
  if (!title.trim()) return;
  await supabase.from('tasks').update({ title: title.trim() }).eq('id', id);
  revalidatePath('/');
}

export async function updateTaskDeadline(id: string, deadline: string | null) {
  await supabase.from('tasks').update({ deadline }).eq('id', id);
  revalidatePath('/');
}

export async function updateTaskOrder(orders: { id: string, display_order: number }[]) {
  await Promise.all(
    orders.map(order => 
      supabase.from('tasks').update({ display_order: order.display_order }).eq('id', order.id)
    )
  );
  revalidatePath('/');
}

export async function deleteTask(id: string) {
  await supabase.from('tasks').delete().eq('id', id);
  revalidatePath('/');
}
