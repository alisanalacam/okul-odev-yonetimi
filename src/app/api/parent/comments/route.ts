import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;

  const { submissionId, commentText, teacherUserId } = await request.json();

  const newComment = await prisma.comment.create({
    data: { submissionId, commentText, userId: parentPayload.userId }
  });
  
  await prisma.notification.create({
      data: { userId: teacherUserId, type: 'comment', referenceId: submissionId }
  });

  return NextResponse.json(newComment, { status: 201 });
}