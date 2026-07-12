import { NextResponse } from 'next/server';
import { getUserByUsername, createUser } from '@/lib/db';
import { setSession } from '@/lib/session';

export async function POST(req) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
    }

    let user = await getUserByUsername(cleanUsername);
    if (!user) {
      // Create a default new user structure
      user = await createUser({
        id: `mock_${Date.now()}`,
        username: cleanUsername,
        displayName: username.trim(),
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${cleanUsername}`,
        background: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        isOnline: false,
        verified: false,
        bio: `Olá, sou ${username}! Bem-vindo ao meu espaço.`,
        socials: {
          instagram: '',
          youtube: '',
          twitch: '',
          discord: `${username}#0000`
        },
        games: ['League of Legends', 'Valorant', 'Minecraft'],
        favoriteGame: 'Minecraft',
        favoriteGameImage: 'https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?w=400&q=80',
        favoriteMusic: 'Estilo Streamer',
        favoriteMusicImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
        views: 1,
        tags: ['Gamer', 'Novo']
      });
    }

    await setSession(user);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Mock login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
