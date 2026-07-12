import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getProductsByUserId, addProduct, updateProduct, deleteProduct } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const products = await getProductsByUserId(session.id);
  return NextResponse.json(products);
}

export async function POST(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, price, image, category } = await req.json();
    if (!title || !price) {
      return NextResponse.json({ error: 'Title and Price are required' }, { status: 400 });
    }

    const product = await addProduct({
      userId: session.id,
      title,
      description: description || '',
      price: parseFloat(price) || 0,
      image: image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&q=80',
      category: category || 'Outros'
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, title, description, price, image, category } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await updateProduct(id, {
      title,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      image,
      category
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
