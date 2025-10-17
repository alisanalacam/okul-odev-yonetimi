// src/app/api/teacher/books/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');

  if (!classId) return NextResponse.json({ message: "Sınıf ID'si gerekli." }, { status: 400 });

  const books = await prisma.book.findMany({ where: { classId: parseInt(classId) } });
  return NextResponse.json(books);
}