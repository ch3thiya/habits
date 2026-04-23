'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Journal } from '@/types';

export async function getJournalsData(): Promise<Journal[]> {
  const { data: journals } = await supabase
    .from('journals')
    .select('*')
    .order('updated_at', { ascending: false });

  return journals || [];
}

export async function addJournal(title: string, content: string = '') {
  if (!title.trim()) return;
  await supabase.from('journals').insert({ 
    title: title.trim(), 
    content,
    updated_at: new Date().toISOString()
  });
  revalidatePath('/');
}

export async function updateJournal(id: string, title: string, content: string) {
  if (!title.trim()) return;
  await supabase.from('journals').update({ 
    title: title.trim(), 
    content,
    updated_at: new Date().toISOString()
  }).eq('id', id);
  revalidatePath('/');
}

export async function deleteJournal(id: string) {
  await supabase.from('journals').delete().eq('id', id);
  revalidatePath('/');
}
