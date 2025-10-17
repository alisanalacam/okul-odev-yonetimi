import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth-utils';

// Tek bir öğretmeni getirme
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;
  
    try {
      const teacherId = parseInt((await params).id);
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId, role: 'teacher' },
        include: {
          teacherDetails: true,
          teacherClasses: {
            select: {
              classId: true, // Sadece sınıf ID'lerini seçmek yeterli
            },
          },
        },
      });
  
      if (!teacher) {
        return NextResponse.json({ message: 'Öğretmen bulunamadı.' }, { status: 404 });
      }
  
      return NextResponse.json(teacher);
    } catch (error) {
      console.error("Öğretmen verisi alınırken hata:", error);
      return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
    }
  }

// Öğretmen Güncelleme
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  const teacherId = parseInt((await params).id);
  const body = await request.json();
  const { name, email, phone, branch, classIds } = body;

  try {
    const updatedTeacher = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: teacherId },
        data: { name, email, phone },
      });
      await tx.teacherDetails.update({
        where: { userId: teacherId },
        data: { branch },
      });
      
      // Mevcut sınıf atamalarını sil
      await tx.teacherClass.deleteMany({ where: { teacherUserId: teacherId } });
      
      // Yeni sınıf atamalarını ekle
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
    return NextResponse.json(updatedTeacher);
  } catch (error) {
    return NextResponse.json({ message: "Güncelleme başarısız" }, { status: 500 });
  }
}

// Öğretmen Silme
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  
  try {
    const teacherId = parseInt((await params).id);
    // Cascade delete sayesinde, ilişkili TeacherDetails ve TeacherClass kayıtları da silinir.
    await prisma.user.delete({ where: { id: teacherId } });
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    return NextResponse.json({ message: "Silme işlemi başarısız" }, { status: 500 });
  }
}