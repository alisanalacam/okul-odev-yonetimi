import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');

  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: 'teacher',
        // Eğer classId query parametresi varsa, sadece o sınıfa ait öğretmenleri getir
        teacherClasses: classId ? { some: { classId: parseInt(classId) } } : {},
      },
      include: {
        teacherDetails: true,
        teacherClasses: {
          include: {
            class: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Öğretmenler listelenirken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await request.json();
    const { name, email, phone, branch, classIds } = body;

    // Gerekli alanları kontrol et
    if (!name || !email || !phone) {
      return NextResponse.json({ message: "İsim, e-posta ve telefon zorunludur." }, { status: 400 });
    }

    // Prisma Transaction: Tüm işlemlerin başarılı olmasını garanti eder.
    // Biri başarısız olursa, hepsi geri alınır.
    const newTeacher = await prisma.$transaction(async (tx) => {
      // 1. User olarak öğretmeni oluştur
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          role: 'teacher',
        },
      });

      // 2. Öğretmen detaylarını oluştur
      await tx.teacherDetails.create({
        data: {
          userId: user.id,
          branch: branch,
        },
      });
      
      // 3. Öğretmeni sınıflara ata (eğer classIds gönderildiyse)
      if (classIds && Array.isArray(classIds) && classIds.length > 0) {
        await tx.teacherClass.createMany({
          data: classIds.map((classId: number) => ({
            teacherUserId: user.id,
            classId: classId,
          })),
        });
      }

      return user;
    });

    return NextResponse.json(newTeacher, { status: 201 });

  } catch (error: any) {
    // E-posta veya telefon zaten kayıtlıysa Prisma P2002 hatası verir
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "Bu e-posta veya telefon zaten kullanılıyor." }, { status: 409 });
    }
    console.error("Öğretmen oluşturulurken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası oluştu." }, { status: 500 });
  }
}