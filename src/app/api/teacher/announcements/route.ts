import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';
import { uploadToR2 } from '@/lib/r2-upload';
import { AnnouncementType } from '@prisma/client';

const ANNOUNCEMENTS_PER_PAGE = 20;

export async function GET(request: NextRequest) {
    const teacherPayload = await verifyTeacher(request);
    if (teacherPayload instanceof NextResponse) return teacherPayload;
    
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');

    try {
      const announcements = await prisma.announcement.findMany({
        take: ANNOUNCEMENTS_PER_PAGE,
        ...(cursor ? { skip: 1, cursor: { id: parseInt(cursor) } } : {}),
        where: { teacherUserId: teacherPayload.userId },
        include: {
          announcementClasses: { include: { class: true } },
          photos: true
        },
        orderBy: { id: 'desc' }
      });
      const nextCursor = announcements.length === ANNOUNCEMENTS_PER_PAGE ? announcements[ANNOUNCEMENTS_PER_PAGE - 1].id : null;
      return NextResponse.json({ announcements, nextCursor });

    } catch (error) {
      return NextResponse.json({ message: "Duyurular listelenemedi" }, { status: 500 });
    }
  }
  
export async function POST(request: NextRequest) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string | null;
    const type = formData.get('type') as AnnouncementType;
    const linkUrl = formData.get('linkUrl') as string | null;
    const classIds = JSON.parse(formData.get('classIds') as string) as number[];
    //const photoFiles = formData.getAll('photos') as File[];
    const photoFiles = formData.getAll('photos') as File[];

    if (!title || !type || !classIds || classIds.length === 0) {
      return NextResponse.json({ message: "Başlık, tür ve sınıf seçimi zorunludur." }, { status: 400 });
    }

    /*let photoUrl: string | undefined = undefined;
    if (type === 'photo' && photoFile) {
      const fileBuffer = Buffer.from(await photoFile.arrayBuffer());
      const { url } = await uploadToR2(fileBuffer, photoFile.name, photoFile.type);
      photoUrl = url;
    }*/

    const newAnnouncement = await prisma.$transaction(async (tx) => {
      // 1. Duyuruyu oluştur
      const announcement = await tx.announcement.create({
        data: {
          teacherUserId: teacherPayload.userId,
          title,
          content,
          type,
          linkUrl
        },
      });

      if (type === 'photo' && photoFiles.length > 0) {
        const photoUploadPromises = photoFiles.map(async (file) => {
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            const { url } = await uploadToR2(fileBuffer, file.name, file.type);
            return { announcementId: announcement.id, photoUrl: url };
        });
        const photoData = await Promise.all(photoUploadPromises);
        await tx.announcementPhoto.createMany({ data: photoData });
    }

      // 2. Duyuruyu seçilen sınıflara bağla
      await tx.announcementClass.createMany({
        data: classIds.map(classId => ({
          announcementId: announcement.id,
          classId: classId,
        })),
      });

      // 3. İlgili velilere bildirim gönder
      const students = await tx.student.findMany({
        where: { classId: { in: classIds } },
        select: { parentUserId: true },
      });
      const parentUserIds = [...new Set(students.map(s => s.parentUserId))];

      await tx.notification.createMany({
        data: parentUserIds.map(userId => ({
          userId: userId,
          type: 'announcement',
          referenceId: announcement.id,
        })),
      });

      return announcement;
    });

    return NextResponse.json(newAnnouncement, { status: 201 });

  } catch (error) {
    console.error("Duyuru oluşturulurken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}