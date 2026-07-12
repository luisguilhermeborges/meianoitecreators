import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById, updateUser } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const allowedUpdates = [
      'displayName',
      'background',
      'bio',
      'socials',
      'games',
      'favoriteGame',
      'favoriteGameImage',
      'favoriteMusic',
      'favoriteMusicImage',
      'isOnline',
      'tags'
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const updatedUser = await updateUser(session.id, updates);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
