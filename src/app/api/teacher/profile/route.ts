import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const teacherPayload = await verifyTeacher(request);
  if (teacherPayload instanceof NextResponse) return teacherPayload;

  try {
    const teacherProfile = await prisma.user.findUnique({
      where: { id: teacherPayload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        teacherDetails: {
          select: { branch: true }
        },
        teacherClasses: {
          select: {
            class: {
              select: { id: true, grade: true, section: true }
            }
          },
          orderBy: { class: { grade: 'asc' } }
        }
      }
    });

    if (!teacherProfile) {
      return NextResponse.json({ message: 'Öğretmen profili bulunamadı.' }, { status: 404 });
    }

    // Veriyi daha temiz bir formatta frontend'e gönderelim
    const profileData = {
      ...teacherProfile,
      branch: teacherProfile.teacherDetails?.branch,
      classes: teacherProfile.teacherClasses.map(tc => tc.class)
    };
    delete (profileData as any).teacherDetails;
    delete (profileData as any).teacherClasses;

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Öğretmen profili alınırken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}