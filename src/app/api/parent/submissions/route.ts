import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';
import { uploadToR2 } from '@/lib/r2-upload';
import { SubmissionStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;

  const formData = await request.formData();
  const studentId = parseInt(formData.get('studentId') as string);
  const homeworkId = parseInt(formData.get('homeworkId') as string);
  const status = formData.get('status') as SubmissionStatus;
  const parentNotes = formData.get('parentNotes') as string;
  const photos = formData.getAll('photos') as File[];

  const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
  if (!homework) return NextResponse.json({ message: "Ödev bulunamadı." }, { status: 404 });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 14); // TODO: 7 günden 14 güne çıkarıldı.

  if (new Date(homework.dueDate) < oneWeekAgo) {
    return NextResponse.json({ message: "Bu ödevin teslim süresi 1 haftadan fazla geçtiği için işlem yapamazsınız." }, { status: 403 }); // 403 Forbidden
  }
  
  const photoUrls = [];
  for (const photo of photos) {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const { url } = await uploadToR2(buffer, photo.name, photo.type);
    photoUrls.push({ photoUrl: url });
  }

  const submission = await prisma.homeworkSubmission.upsert({
    where: { studentId_homeworkId: { studentId, homeworkId } },
    update: { status, parentNotes, submittedAt: new Date(), photos: { create: photoUrls } },
    create: {
      studentId, homeworkId, status, parentNotes, submittedAt: new Date(), photos: { create: photoUrls }
    }
  });

  return NextResponse.json(submission);
}