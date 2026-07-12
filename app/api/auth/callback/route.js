import { NextResponse } from 'next/server';
import { getUserByUsername, createUser, updateUser } from '@/lib/db';
import { setSession } from '@/lib/session';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', req.url));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Failed to exchange code:', errorData);
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', req.url));
    }

    const { access_token } = await tokenResponse.json();

    // Fetch user details from Discord
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/?error=fetch_user_failed', req.url));
    }

    const discordUser = await userResponse.json();
    const username = discordUser.username.toLowerCase();
    
    // Check if user already exists
    let user = await getUserByUsername(username);

    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`;

    if (!user) {
      // Create new user
      user = await createUser({
        id: discordUser.id,
        username,
        displayName: discordUser.global_name || discordUser.username,
        avatar: avatarUrl,
        background: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        isOnline: false,
        verified: false,
        bio: `Olá, sou ${discordUser.global_name || discordUser.username}! Conectado via Discord.`,
        socials: {
          instagram: '',
          youtube: '',
          twitch: '',
          discord: `${discordUser.username}#${discordUser.discriminator || '0000'}`
        },
        games: [],
        favoriteGame: '',
        favoriteGameImage: '',
        favoriteMusic: '',
        favoriteMusicImage: '',
        views: 0,
        tags: ['Discord Sync']
      });
    } else {
      // Update avatar or display name if necessary
      user = await updateUser(user.id, {
        avatar: avatarUrl,
        displayName: discordUser.global_name || discordUser.username
      });
    }

    await setSession(user);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(new URL('/?error=callback_error', req.url));
  }
}
