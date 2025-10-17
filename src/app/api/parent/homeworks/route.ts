import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;
  
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const date = searchParams.get('date'); // YYYY-MM-DD formatında

  if (!studentId || !date) {
    return NextResponse.json({ message: "Öğrenci ID'si ve tarih zorunludur." }, { status: 400 });
  }

  try {
    const numStudentId = parseInt(studentId);

    // 1. Öğrencinin sınıfını bul
    const student = await prisma.student.findUnique({
      where: { id: numStudentId },
      select: { classId: true }
    });

    if (!student) {
      return NextResponse.json({ message: "Öğrenci bulunamadı." }, { status: 404 });
    }

    // 2. O sınıfa ve o tarihe ait tüm ödevleri bul
    const homeworksForClass = await prisma.homework.findMany({
      where: {
        classId: student.classId,
        dueDate: new Date(date),
      },
      include: {
        book: true, // Kitap bilgilerini de al
      },
    });

    // 3. Öğrencinin bu ödevlere yaptığı teslimleri bul
    const submissions = await prisma.homeworkSubmission.findMany({
      where: {
        studentId: numStudentId,
        homeworkId: { in: homeworksForClass.map(hw => hw.id) },
      },
    });

    // 4. Ödevleri ve teslim durumlarını birleştir
    const homeworksWithStatus = homeworksForClass.map(homework => {
      const submission = submissions.find(s => s.homeworkId === homework.id);
      return {
        ...homework,
        status: submission ? submission.status : 'pending',
        submissionId: submission ? submission.id : null,
      };
    });

    return NextResponse.json(homeworksWithStatus);
  } catch (error) {
    console.error("Veli için ödevler alınırken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}