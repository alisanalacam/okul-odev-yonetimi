import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth-utils';
import { uploadToR2 } from '@/lib/r2-upload';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

// TEK BİR KİTABI GETİRME
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  try {
    const book = await prisma.book.findUnique({ where: { id: parseInt((await params).id) } });
    if (!book) return NextResponse.json({ message: 'Kitap bulunamadı.' }, { status: 404 });
    return NextResponse.json(book);
  } catch (error) { return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 }); }
}

// KİTAP GÜNCELLEME (Dosya yükleme dahil)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  
  try {
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const classId = formData.get('classId') as string;
    const pageCount = formData.get('pageCount') as string;
    const existingImageUrl = formData.get('existingImageUrl') as string | null;
    const coverImageFile = formData.get('coverImage') as File | null;

    let coverImageUrl: string | undefined | null = existingImageUrl;

    if (coverImageFile) {
      const fileBuffer = Buffer.from(await coverImageFile.arrayBuffer());
      const { url } = await uploadToR2(fileBuffer, coverImageFile.name, coverImageFile.type);
      coverImageUrl = url;
    }
    
    const updatedBook = await prisma.book.update({
        where: { id: parseInt((await params).id) },
        data: {
            name: name,
            classId: parseInt(classId),
            pageCount: pageCount ? parseInt(pageCount) : null,
            coverImageUrl: coverImageUrl,
        }
    });
    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error("Kitap güncellenirken hata:", error);
    return NextResponse.json({ message: "Güncelleme başarısız" }, { status: 500 });
  }
}

// KİTAP SİLME
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdmin(request);
  if (adminCheck instanceof NextResponse) return adminCheck;
  try {
    // Not: Bu işlem sadece veritabanından siler, R2'deki resmi silmez.
    // İstenirse R2'den silme kodu da eklenebilir.
    await prisma.book.delete({ where: { id: parseInt((await params).id) } });
    return new NextResponse(null, { status: 204 });
  } catch (error) { return NextResponse.json({ message: "Silme işlemi başarısız" }, { status: 500 }); }
}