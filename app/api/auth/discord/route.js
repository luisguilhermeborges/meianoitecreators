import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

  if (!clientId) {
    // If client ID is missing, redirect to mock login with warning
    return NextResponse.redirect(new URL('/?error=discord_not_configured', 'http://localhost:3000'));
  }

  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;
  return NextResponse.redirect(url);
}
