import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentName, parentEmail, parentPhone, studentName, studentClass } = body;

    // 1. Gelen veriyi doğrula
    if (!parentName || !parentEmail || !parentPhone || !studentName || !studentClass?.grade || !studentClass?.section) {
      return NextResponse.json({ message: 'Tüm veli ve öğrenci alanları zorunludur.' }, { status: 400 });
    }

    // 2. Veli e-posta veya telefonunun zaten kullanımda olup olmadığını kontrol et
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: parentEmail }, { phone: parentPhone }] },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Bu e-posta veya telefon numarası zaten başka bir veli tarafından kullanılıyor.' }, { status: 409 });
    }

    // 3. Veli, Sınıf ve Öğrenciyi tek bir transaction içinde oluştur
    const result = await prisma.$transaction(async (tx) => {
      // a. Veli'yi oluştur
      const parent = await tx.user.create({
        data: {
          name: parentName,
          email: parentEmail,
          phone: parentPhone,
          role: Role.parent,
        },
      });

      // b. Sınıfın var olup olmadığını kontrol et, yoksa oluştur (upsert)
      let existingClass = await tx.class.findFirst({
          where: { grade: studentClass.grade, section: studentClass.section },
      });
      if (!existingClass) {
          return NextResponse.json({ message: 'Sınıf seçimi yapınız.' }, { status: 409 });
      }

      // c. Öğrenci'yi oluştur ve Veli'ye/Sınıf'a bağla
      const student = await tx.student.create({
        data: {
          name: studentName,
          classId: existingClass.id,
          parentUserId: parent.id,
        },
      });

      return { parent, student };
    });

    return NextResponse.json({ message: 'Veli ve öğrenci kaydı başarılı!' }, { status: 201 });

  } catch (error) {
    console.error('Kayıt API Hatası:', error);
    return NextResponse.json({ message: 'Sunucuda bir hata oluştu.' }, { status: 500 });
  }
}