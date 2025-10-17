import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';
import { HomeworkSubmission } from '@prisma/client';
import { deleteFromR2 } from '@/lib/r2-upload';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  try {
    // Hatanın olduğu satır burasıydı. Kod zaten doğru, sadece emin olmak için
    // ve olası bir copy-paste hatasını düzeltmek için yeniden yazıyoruz.
    const homeworkId = parseInt((await params).id);

    // 1. Ödevin ana bilgilerini çek
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      //@ts-ignore
      include: { book: true, class: true, attachments: true },
    });

    if (!homework) {
      return NextResponse.json({ message: "Ödev bulunamadı" }, { status: 404 });
    }

    // 2. Ödevin verildiği sınıftaki tüm öğrencileri çek
    const studentsInClass = await prisma.student.findMany({
      where: { classId: homework.classId },
      orderBy: { name: 'asc' },
    });

    // 3. Bu ödeve ait tüm teslimleri (submission) çek
    const submissions = await prisma.homeworkSubmission.findMany({
      where: { homeworkId: homeworkId },
    });
    
    // 4. Öğrencilerle teslimleri eşleştir
    const studentsWithStatus = studentsInClass.map(student => {
      const submission = submissions.find(s => s.studentId === student.id);
      return {
        ...student,
        status: submission ? submission.status : 'pending', // Teslim yoksa 'bekleniyor'
        submissionId: submission ? submission.id : null,
        parentUserId: student.parentUserId, // parentUserId'yi de ekleyelim
      };
    });

    const responseData = {
      ...homework,
      students: studentsWithStatus,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Ödev detayı alınırken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  try {
    const homeworkId = parseInt((await params).id);

    const homeworkToDelete = await prisma.homework.findUnique({
      where: {
        id: homeworkId,
        teacherUserId: teacherPayload.userId,
      },
      include: {
        //@ts-ignore
        attachments: true,
      },
    });

    if (!homeworkToDelete) {
      return NextResponse.json({ message: "Ödev bulunamadı veya silme yetkiniz yok." }, { status: 404 });
    }
//@ts-ignore
    if (homeworkToDelete.attachments && homeworkToDelete.attachments.length > 0) {
      //@ts-ignore
      const fileUrls = homeworkToDelete.attachments.map(p => p.fileUrl);
      await deleteFromR2(fileUrls);
    }

    await prisma.homework.delete({ where: { id: homeworkId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Ödev silinirken hata:", error);
    return NextResponse.json({ message: "Silme işlemi başarısız oldu." }, { status: 500 });
  }
}