import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

export async function GET(request: NextRequest, { params }: { params: { homeworkId: string } }) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const homeworkId = parseInt(params.homeworkId);

  if (!studentId) return NextResponse.json({ message: "Öğrenci ID gerekli" }, { status: 400 });

  const homework = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: { book: true, teacher: { select: { name: true } } }
  });

  const submission = await prisma.homeworkSubmission.findUnique({
    where: { studentId_homeworkId: { studentId: parseInt(studentId), homeworkId: homeworkId } },
    include: { photos: true, comments: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } } }
  });
  
  return NextResponse.json({ homework, submission });
}