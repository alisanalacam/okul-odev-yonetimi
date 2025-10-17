import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  const { submissionId, commentText, parentUserId } = await request.json();

  const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      select: { homeworkId: true }
  });

  if (!submission) {
      return NextResponse.json({ message: "Teslim bulunamadı" }, { status: 404 });
  }

  const newComment = await prisma.comment.create({
    data: {
      submissionId: submissionId,
      commentText: commentText,
      userId: teacherPayload.userId, // Yorumu yapan öğretmen
    },
  });
  
  // Veliye bildirim gönder
  await prisma.notification.create({
      data: {
          userId: parentUserId,
          type: 'comment',
          referenceId: submissionId
      }
  });

  return NextResponse.json(newComment, { status: 201 });
}