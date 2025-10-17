import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;

  try {
    const parentProfile = await prisma.user.findUnique({
      where: { id: parentPayload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        studentsAsParent: {
          select: {
            id: true,
            name: true,
            class: {
              select: { id: true, grade: true, section: true }
            }
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!parentProfile) {
      return NextResponse.json({ message: 'Veli profili bulunamadı.' }, { status: 404 });
    }

    // Frontend'e daha temiz bir isimle gönderelim
    const profileData = {
      ...parentProfile,
      students: parentProfile.studentsAsParent,
    };
    delete (profileData as any).studentsAsParent;

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Veli profili alınırken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}