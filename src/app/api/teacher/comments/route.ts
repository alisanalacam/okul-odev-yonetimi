import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';
//import { sendNotification } from '@/lib/onesignal-sender'; 

export async function POST(request: NextRequest) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  const { submissionId, commentText, parentUserId } = await request.json();

  const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: { homework: { include: { book: true } } }
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

  /*try {
      const parent = await prisma.user.findUnique({ where: { id: parentUserId } });

      //@ts-ignore
      const oneSignalPlayerId = parent?.oneSignalPlayerId;

      //@ts-ignore
      const messageContent = `${submission.homework.book.name} isimli ödeve öğretmeniniz bir yorum yaptı.`;

      if (oneSignalPlayerId) {
          await sendNotification({
              playerIds: [oneSignalPlayerId],
              title: "Öğretmenden Yeni Bir Mesaj Var!",
              message: messageContent,
              url: `https://okul-odev.vobion.com/parent/submission/${submissionId}`
          });
      }
  } catch (error) {
      console.error("OneSignal push notification gönderilirken hata:", error);
  }*/

  return NextResponse.json(newComment, { status: 201 });
}