import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    });
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}