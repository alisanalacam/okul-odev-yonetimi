import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

// ÖĞRENCİNİN OKUDUĞU KİTAPLARI LİSTELEME
export async function GET(request: NextRequest) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;
  
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json({ message: "Öğrenci ID'si zorunludur." }, { status: 400 });
  }

  //@ts-ignore
  const logs = await prisma.bookLog.findMany({
    where: { studentId: parseInt(studentId) },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(logs);
}

// YENİ BİR OKUNAN KİTAP EKLEME
export async function POST(request: NextRequest) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;

  try {
    const { studentId, bookName, description } = await request.json();

    if (!studentId || !bookName) {
      return NextResponse.json({ message: "Öğrenci ID'si ve Kitap Adı zorunludur." }, { status: 400 });
    }

    //@ts-ignore
    const newLog = await prisma.bookLog.create({
      data: {
        studentId: parseInt(studentId),
        bookName: bookName,
        description: description,
      },
    });

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error("Kitap kaydı oluşturulurken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}