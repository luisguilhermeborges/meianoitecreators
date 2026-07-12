import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

export async function GET() {
  try {
    const users = await getUsers();
    // Return key details for public view
    const publicUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      isOnline: u.isOnline,
      verified: u.verified,
      tags: u.tags || []
    }));
    return NextResponse.json(publicUsers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch streamers' }, { status: 500 });
  }
}
