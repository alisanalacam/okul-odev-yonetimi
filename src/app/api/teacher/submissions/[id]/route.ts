import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  try {
    const submissionId = parseInt((await params).id);
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: true,
        homework: { include: { book: true } },
        photos: true,
        comments: {
          include: { user: { select: { name: true, role: true } } }, // Yorumu yapanın adını ve rolünü al
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!submission) return NextResponse.json({ message: "Teslim bulunamadı" }, { status: 404 });
    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}