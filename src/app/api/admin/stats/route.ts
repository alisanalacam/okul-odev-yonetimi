import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  // 1. Admin yetkisini kontrol et
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) {
    return adminCheck; // Yetkilendirme başarısızsa hata mesajını döndür
  }

  try {
    // 2. Prisma ile verileri say
    const teacherCount = await prisma.user.count({
      where: { role: 'teacher' },
    });

    const studentCount = await prisma.student.count();

    const bookCount = await prisma.book.count();

    // 3. Sonuçları döndür
    return NextResponse.json({
      teacherCount,
      studentCount,
      bookCount,
    });

  } catch (error) {
    console.error("İstatistik alınırken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası oluştu." }, { status: 500 });
  }
}