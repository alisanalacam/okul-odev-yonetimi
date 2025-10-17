import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    // 1. Gelen veriyi doğrula
    if (!email || !phone) {
      return NextResponse.json(
        { message: 'E-posta ve telefon numarası zorunludur.' },
        { status: 400 } // Bad Request
      );
    }

    // 2. Veritabanında kullanıcıyı ara
    const user = await prisma.user.findUnique({
      where: {
        email: email,
        // Prisma'da birden fazla alana göre arama yapmak için unique bir index gerekir.
        // Biz şimdilik sadece e-posta ve telefonun eşleşmesini kontrol edelim.
      },
    });

    // Kullanıcı bulunamazsa veya telefon no eşleşmezse hata döndür
    if (!user || user.phone !== phone) {
      return NextResponse.json(
        { message: 'Geçersiz e-posta veya telefon numarası.' },
        { status: 404 } // Not Found
      );
    }

    // 3. Kullanıcı bulunduysa, JWT oluştur
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        // Bu hata geliştirme aşamasında .env dosyasını unuttuysanız ortaya çıkar.
        throw new Error("JWT_SECRET environment variable is not set!");
    }

    // Token'ın içine koyacağımız bilgiler (Payload)
    const payload = {
      userId: user.id,
      role: user.role,
      name: user.name,
    };

    // Token'ı imzala (1 gün geçerli olacak şekilde)
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });

    // 4. Başarılı cevabı ve token'ı geri döndür
    return NextResponse.json({
      message: 'Giriş başarılı!',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { message: 'Sunucuda bir hata oluştu.' },
      { status: 500 } // Internal Server Error
    );
  }
}