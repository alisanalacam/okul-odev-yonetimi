import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth-utils';
import { uploadToR2 } from '@/lib/r2-upload';

// Next.js'in varsayılan body parser'ını bu rota için devre dışı bırakıyoruz
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');

  try {
    const books = await prisma.book.findMany({
      where: {
        classId: classId ? parseInt(classId) : undefined,
      },
      include: {
        class: true, // Sınıf bilgisini de dahil et
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(books);
  } catch (error) {
    console.error("Kitaplar listelenirken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;

  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const classId = formData.get('classId');
    const pageCount = formData.get('pageCount') as string;
    const coverImageFile = formData.get('coverImage') as File | null;

    if (!name || !classId) {
      return NextResponse.json({ message: "Kitap adı, sınıf ve şube zorunludur." }, { status: 400 });
    }

    let coverImageUrl: string | undefined = undefined;

    if (coverImageFile) {
      const fileBuffer = Buffer.from(await coverImageFile.arrayBuffer());
      const { url } = await uploadToR2(fileBuffer, coverImageFile.name, coverImageFile.type);
      coverImageUrl = url;
    }

    const newBook = await prisma.$transaction(async (tx) => {
        
        const book = await tx.book.create({
            data: {
                name: name,
                classId: parseInt(classId as string),
                pageCount: pageCount ? parseInt(pageCount) : undefined,
                coverImageUrl: coverImageUrl,
            }
        });
        return book;
    });

    return NextResponse.json(newBook, { status: 201 });

  } catch (error) {
    console.error("Kitap oluşturulurken hata:", error);
    return NextResponse.json({ message: "Sunucu hatası oluştu." }, { status: 500 });
  }
}