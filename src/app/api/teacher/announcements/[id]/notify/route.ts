import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';
import { sendNotification } from '@/lib/onesignal-sender';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  try {
    const announcementId = parseInt((await params).id);

    // 1. Duyuruyu ve ilişkili sınıfları bul
    const announcement = await prisma.announcement.findUnique({
      where: {
        id: announcementId,
        teacherUserId: teacherPayload.userId, // Güvenlik: Sadece kendi duyurusunu gönderebilir
      },
      include: {
        announcementClasses: {
          select: {
            classId: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json({ message: "Duyuru bulunamadı veya bu işlem için yetkiniz yok." }, { status: 404 });
    }

    const classIds = announcement.announcementClasses.map(ac => ac.classId);

    if (classIds.length === 0) {
      return NextResponse.json({ message: "Bu duyuru hiçbir sınıfa atanmadığı için bildirim gönderilemez." }, { status: 400 });
    }

    // 2. Bu sınıflardaki tüm öğrencilerin velilerini bul
    const students = await prisma.student.findMany({
      where: { classId: { in: classIds } },
      select: { parentUserId: true },
    });
    
    // Benzersiz veli ID'lerini al
    const parentUserIds = [...new Set(students.map(s => s.parentUserId))];

    // 3. Veli'lerin OneSignal Player ID'lerini al
    const parents = await prisma.user.findMany({
      where: {
        id: { in: parentUserIds },
        oneSignalPlayerId: { not: null }, // Sadece Player ID'si olanları al
      },
      select: { oneSignalPlayerId: true },
    });

    const playerIds = parents.map(p => p.oneSignalPlayerId!).filter(Boolean);

    if (playerIds.length === 0) {
        return NextResponse.json({ message: "Bu sınıflarda bildirim alacak kayıtlı veli bulunamadı." }, { status: 404 });
    }

    // 4. OneSignal ile bildirim gönder
    await sendNotification({
      playerIds: playerIds,
      title: "Öğretmeninizden Yeni Bir Duyuru Var!",
      message: `"${announcement.title}" başlıklı yeni bir duyuru yayınlandı.`,
      url: `https://okul-odev.vobion.com/parent/announcements/${announcement.id}` // Veli panelindeki duyuru detay linki
    });

    return NextResponse.json({ success: true, message: `${playerIds.length} veliye bildirim başarıyla gönderildi.` });

  } catch (error) {
    console.error("Duyuru bildirimi gönderilirken hata:", error);
    return NextResponse.json({ message: "Bildirim gönderimi sırasında bir hata oluştu." }, { status: 500 });
  }
}