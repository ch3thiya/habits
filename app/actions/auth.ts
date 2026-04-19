'use server';

import { cookies } from 'next/headers';

export async function login(password: string) {
  const adminPassword = process.env.APP_PASSWORD;

  if (password === adminPassword) {
    (await cookies()).set('auth_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    return { success: true };
  }
  
  return { success: false, error: 'Invalid password' };
}

export async function logout() {
  (await cookies()).delete('auth_session');
  return { success: true };
}
