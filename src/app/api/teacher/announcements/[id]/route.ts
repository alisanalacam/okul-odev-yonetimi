import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';
import { deleteFromR2 } from '@/lib/r2-upload'; // Import the new function

// TEK BİR DUYURUYU GETİRME
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;
  
  try {
    const announcementId = parseInt((await params).id);
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        announcementClasses: { include: { class: true } }, 
        //@ts-ignore
        attachments: true
      }
    });

    if (!announcement) {
      return NextResponse.json({ message: "Duyuru bulunamadı" }, { status: 404 });
    }

    // Sadece bu öğretmenin oluşturduğu duyuruları görmesini sağlamak için ek kontrol (opsiyonel)
    // if (announcement.teacherUserId !== teacherPayload.userId) {
    //   return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
    // }

    return NextResponse.json(announcement);
  } catch (error) {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

// DUYURU SİLME
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;
  
  try {
    const announcementId = parseInt((await params).id);

    const announcementToDelete = await prisma.announcement.findUnique({
      where: {
        id: announcementId,
        teacherUserId: teacherPayload.userId, // Güvenlik kontrolü
      },
      include: {
        //@ts-ignore
        attachments: true,
      },
    });

    if (!announcementToDelete) {
      return NextResponse.json({ message: "Duyuru bulunamadı veya silme yetkiniz yok." }, { status: 404 });
    }

    // Prisma'da onDelete: Cascade ayarlandığı için ilişkili AnnouncementClass kayıtları da silinir.  
    
    //@ts-ignore
    if (announcementToDelete.attachments && announcementToDelete.attachments.length > 0) {
      //@ts-ignore
      const fileUrls = announcementToDelete.attachments.map(att => att.fileUrl);
      await deleteFromR2(fileUrls);
    }
    //@ts-ignore
    await prisma.announcementAttachment.deleteMany({
      where: {
        announcementId: announcementId,
      },
    });

    await prisma.announcementClass.deleteMany({
      where: {
        announcementId: announcementId,
      },
    });

    await prisma.notification.deleteMany({
      where: {
        referenceId: announcementId,
        type: 'announcement',
      },
    });

    await prisma.announcement.delete({
      where: {
        id: announcementId,
        teacherUserId: teacherPayload.userId, // Sadece kendi duyurusunu silebilsin
      },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    // Silinecek kayıt bulunamazsa Prisma hata verir, bu da yetkisiz silme denemelerini engeller.
    return NextResponse.json({ message: "Silme işlemi başarısız veya yetkisiz." }, { status: 500 });
  }
}