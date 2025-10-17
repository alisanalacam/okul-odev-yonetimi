// src/app/api/parent/announcements/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

const ANNOUNCEMENTS_PER_PAGE = 20;

export async function GET(request: NextRequest) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const cursor = searchParams.get('cursor');

  if (!studentId) return NextResponse.json({ message: "Öğrenci ID gerekli" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { id: parseInt(studentId) }});
  if (!student) return NextResponse.json({ message: "Öğrenci bulunamadı" }, { status: 404 });

  // Öğrencinin sınıfına yapılmış tüm duyuruları getir
  const announcements = await prisma.announcement.findMany({
    take: ANNOUNCEMENTS_PER_PAGE,
      ...(cursor ? { skip: 1, cursor: { id: parseInt(cursor) } } : {}),
    where: { announcementClasses: { some: { classId: student.classId } } },
    orderBy: { createdAt: 'desc' },
  });
  const nextCursor = announcements.length === ANNOUNCEMENTS_PER_PAGE ? announcements[ANNOUNCEMENTS_PER_PAGE - 1].id : null;

  return NextResponse.json({ announcements, nextCursor });
}