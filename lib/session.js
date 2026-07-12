import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'bazar_session';

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

export async function setSession(user) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
