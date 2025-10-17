// src/app/api/teacher/homeworks/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';
import { uploadToR2 } from '@/lib/r2-upload'; 

// Ödevleri Tarihe ve Sınıfa Göre Listeleme
export async function GET(request: NextRequest) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  const loggedInTeacherId = teacherPayload.userId;

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const date = searchParams.get('date'); // YYYY-MM-DD formatında

  if (!classId || !date) return NextResponse.json({ message: "Sınıf ve Tarih gerekli." }, { status: 400 });

  const homeworks = await prisma.homework.findMany({
    where: { classId: parseInt(classId), dueDate: new Date(date), teacherUserId: loggedInTeacherId },
    include: { book: true }
  });
  return NextResponse.json(homeworks);
}

// Yeni Ödev(ler) Ekleme
/*export async function POST(request: NextRequest) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  const body = await request.json();
  const { classId, date, homeworks } = body; // homeworks: [{ bookId, notes }]

  const createdHomeworks = [];
  for (const hw of homeworks) {
      const createdHw = await prisma.homework.create({
          data: {
              teacherUserId: teacherPayload.userId,
              classId: parseInt(classId),
              dueDate: new Date(date),
              bookId: parseInt(hw.bookId),
              notes: hw.notes,
          },
      });

      // Eğer base64 fotoğraflar varsa R2'ye yükle ve kaydet
      if (hw.photosBase64 && hw.photosBase64.length > 0) {
          const photoUploads = hw.photosBase64.map(async (base64String: string) => {
              const buffer = Buffer.from(base64String, 'base64');
              // mime type'ı base64'ten çıkarmak gerekebilir veya varsayılan kullanılabilir
              const { url } = await uploadToR2(buffer, `homework-${createdHw.id}-${Date.now()}.jpg`, 'image/jpeg'); 
              return { homeworkId: createdHw.id, photoUrl: url };
          });
          const photoData = await Promise.all(photoUploads);
          await prisma.homeworkPhoto.createMany({ data: photoData });
      }
      createdHomeworks.push(createdHw);
  }
  

  return NextResponse.json({ message: "Ödevler başarıyla eklendi." }, { status: 201 });
}*/
export async function POST(request: NextRequest) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  try {
    const formData = await request.formData();
    const classId = formData.get('classId') as string;
    const date = formData.get('date') as string;
    // homeworks verisi artık JSON string olarak gelecek, parse etmeliyiz
    const homeworks = JSON.parse(formData.get('homeworks') as string); 
    
    for (const hw of homeworks) {
        const createdHw = await prisma.homework.create({
            data: {
                teacherUserId: teacherPayload.userId,
                classId: parseInt(classId),
                dueDate: new Date(date),
                bookId: parseInt(hw.bookId),
                notes: hw.notes,
            },
        });

        // Bu ödeve ait dosyaları al (örn: 'files_12345')
        const files = formData.getAll(`files_${hw.id}`) as File[];

        if (files.length > 0) {
            const fileUploadPromises = files.map(async (file) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const { url } = await uploadToR2(buffer, file.name, file.type);
                return { 
                    homeworkId: createdHw.id, 
                    fileUrl: url,
                    fileName: file.name,
                    fileType: file.type
                };
            });
            const fileData = await Promise.all(fileUploadPromises);
            //@ts-ignore
            await prisma.homeworkAttachment.createMany({ data: fileData });
        }
    }

    return NextResponse.json({ message: "Ödevler başarıyla eklendi." }, { status: 201 });
  } catch (error) {
    console.error("Ödev oluşturulurken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}