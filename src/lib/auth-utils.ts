import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

// Token'dan gelen payload'ın tipini tanımlayalım
interface AuthPayload {
  userId: number;
  role: string;
  name: string;
}

export async function verifyAdmin(request: NextRequest): Promise<AuthPayload | NextResponse> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Yetkisiz erişim: Token bulunamadı.' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET tanımlı değil.");
    }

    const payload = jwt.verify(token, jwtSecret) as AuthPayload;

    if (payload.role !== 'admin') {
      return NextResponse.json({ message: 'Erişim reddedildi: Admin yetkisi gerekli.' }, { status: 403 });
    }

    // Kullanıcının veritabanında hala var olup olmadığını kontrol etmek iyi bir pratiktir.
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ message: 'Geçersiz kullanıcı veya yetki.' }, { status: 403 });
    }

    return payload; // Yetkilendirme başarılı, kullanıcı bilgilerini döndür
  } catch (error) {
    return NextResponse.json({ message: 'Geçersiz veya süresi dolmuş token.' }, { status: 401 });
  }
}

export async function verifyTeacher(request: NextRequest): Promise<AuthPayload | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Yetkisiz erişim: Token bulunamadı.' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, jwtSecret) as AuthPayload;
    if (payload.role !== 'teacher') {
      return NextResponse.json({ message: 'Erişim reddedildi: Öğretmen yetkisi gerekli.' }, { status: 403 });
    }
    return payload;
  } catch (error) {
    return NextResponse.json({ message: 'Geçersiz token.' }, { status: 401 });
  }
}

export async function verifyParent(request: NextRequest): Promise<AuthPayload | NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Yetkisiz erişim: Token bulunamadı.' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, jwtSecret) as AuthPayload;
    if (payload.role !== 'parent') {
      return NextResponse.json({ message: 'Erişim reddedildi: Veli yetkisi gerekli.' }, { status: 403 });
    }
    return payload;
  } catch (error) {
    return NextResponse.json({ message: 'Geçersiz token.' }, { status: 401 });
  }
}