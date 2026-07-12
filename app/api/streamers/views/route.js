import { NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentViews = user.views || 0;
    const updatedUser = await updateUser(userId, { views: currentViews + 1 });
    return NextResponse.json({ success: true, views: updatedUser.views });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
