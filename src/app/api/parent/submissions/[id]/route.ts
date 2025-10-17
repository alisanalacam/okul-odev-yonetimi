// TODO: Yeni Eklendi
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;

  const submissionId = parseInt(params.id);

  const submission = await prisma.homeworkSubmission.findUnique({
    where: { id: submissionId },
    include: { 
      comments: { include: { user: { select: { name: true, role: true } } }, orderBy: { createdAt: 'asc' } },
      homework: { // Homework'ü de buradan çekiyoruz
        include: { book: true, attachments: true, teacher: { select: { name: true, id: true } } }
      }
    }
  });

  if (!submission) {
    return NextResponse.json({ message: "Teslim bulunamadı" }, { status: 404 });
  }

  // Diğer API ile aynı veri yapısını oluşturmak için homework'ü dışarı çıkarıyoruz.
  const responseData = {
    homework: submission.homework,
    submission: {
      ...submission,
      homework: undefined, // İç içe homework objesini temizle
    }
  };

  return NextResponse.json(responseData);
}