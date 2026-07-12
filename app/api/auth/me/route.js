import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ loggedIn: false });
  }
  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ loggedIn: false });
  }
  return NextResponse.json({ loggedIn: true, user });
}
