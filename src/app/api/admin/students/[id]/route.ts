import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth-utils';

// TEK BİR ÖĞRENCİYİ GETİRME
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const studentId = parseInt((await params).id);
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        parent: true,
      },
    });

    if (!student) {
      return NextResponse.json({ message: 'Öğrenci bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

// ÖĞRENCİ GÜNCELLEME
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const studentId = parseInt((await params).id);
  const body = await request.json();
  const { studentName, classId, parentName, parentEmail, parentPhone } = body;

  try {
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Veli bilgisini bul veya güncelle. E-posta'nın değişmediğini varsayıyoruz.
      const parent = await tx.user.upsert({
        where: { email: parentEmail },
        update: { name: parentName, phone: parentPhone },
        create: { name: parentName, email: parentEmail, phone: parentPhone, role: 'parent' }
      });

      // Öğrenciyi güncelle
      const student = await tx.student.update({
        where: { id: studentId },
        data: {
          name: studentName,
          classId: classId,
          parentUserId: parent.id,
        },
      });
      return student;
    });

    return NextResponse.json(updatedStudent);
  } catch (error) {
    return NextResponse.json({ message: "Güncelleme başarısız" }, { status: 500 });
  }
}

// ÖĞRENCİ SİLME
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const studentId = parseInt((await params).id);
    await prisma.student.delete({ where: { id: studentId } });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    return NextResponse.json({ message: "Silme işlemi başarısız" }, { status: 500 });
  }
}