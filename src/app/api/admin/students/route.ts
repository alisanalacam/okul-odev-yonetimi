import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth-utils';

// ÖĞRENCİ LİSTELEME (FİLTRELİ)
export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');

  try {
    const students = await prisma.student.findMany({
      where: {
        classId: classId ? parseInt(classId) : undefined,
      },
      include: {
        class: true,
        parent: {
          select: { name: true, email: true } // Veli'nin sadece gerekli bilgilerini alalım
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error("Öğrenciler listelenirken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

// ÖĞRENCİ EKLEME (Mevcut kodumuz, bir değişiklik yok)
export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  
  try {
    const body = await request.json();
    const { studentName, studentClass, parentName, parentEmail, parentPhone } = body; 

    if (!studentName || !studentClass || !parentName || !parentEmail || !parentPhone) {
        return NextResponse.json({ message: "Tüm alanlar zorunludur." }, { status: 400 });
    }

    const newStudent = await prisma.$transaction(async (tx) => {
        let parent = await tx.user.findUnique({ where: { email: parentEmail } });
        if (!parent) {
            parent = await tx.user.create({
                data: { name: parentName, email: parentEmail, phone: parentPhone, role: 'parent' }
            });
        }

        let existingClass = await tx.class.findFirst({
            where: { grade: studentClass.grade, section: studentClass.section },
        });
        if (!existingClass) {
            existingClass = await tx.class.create({
                data: { grade: studentClass.grade, section: studentClass.section },
            });
        }

        const student = await tx.student.create({
            data: { name: studentName, classId: existingClass.id, parentUserId: parent.id }
        });

        return student;
    });

    return NextResponse.json(newStudent, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2002') {
        return NextResponse.json({ message: "Bu veli e-postası veya telefonu zaten kullanılıyor." }, { status: 409 });
    }
    console.error("Öğrenci oluşturulurken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası oluştu." }, { status: 500 });
  }
}