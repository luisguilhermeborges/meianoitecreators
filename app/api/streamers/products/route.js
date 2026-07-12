import { NextResponse } from 'next/server';
import { getProductsByUserId } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const products = await getProductsByUserId(userId);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
