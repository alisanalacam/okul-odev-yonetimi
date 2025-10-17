import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';
import { deleteFromR2 } from '@/lib/r2-upload'; // Import the new function

// TEK BİR DUYURUYU GETİRME
export async function GET(request: NextRequest, { params }: { params: { id:string } }) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;
  
  try {
    const announcementId = parseInt(params.id);
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        announcementClasses: { include: { class: true } }, 
        photos: true
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
export async function DELETE(request: NextRequest, { params }: { params: { id:string } }) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;
  
  try {
    const announcementId = parseInt(params.id);

    const announcementToDelete = await prisma.announcement.findUnique({
      where: {
        id: announcementId,
        teacherUserId: teacherPayload.userId, // Güvenlik kontrolü
      },
      include: {
        photos: true,
      },
    });

    if (!announcementToDelete) {
      return NextResponse.json({ message: "Duyuru bulunamadı veya silme yetkiniz yok." }, { status: 404 });
    }

    // Prisma'da onDelete: Cascade ayarlandığı için ilişkili AnnouncementClass kayıtları da silinir.  
    
    if (announcementToDelete.photos && announcementToDelete.photos.length > 0) {
      const photoUrls = announcementToDelete.photos.map(p => p.photoUrl);
      await deleteFromR2(photoUrls);
    }
    await prisma.announcementPhoto.deleteMany({
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