import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Kullanıcıyı token'dan alıp yetkilendirme yapalım
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ message: "Yetkisiz" }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    
    try {
        const notificationId = parseInt((await params).id);

        // Sadece kullanıcının kendi bildirimini güncelleyebilmesini sağla
        await prisma.notification.update({
            where: {
                id: notificationId,
                userId: payload.userId, // Güvenlik katmanı
            },
            data: {
                isRead: true,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // Kayıt bulunamazsa veya başka bir hata olursa
        return NextResponse.json({ message: "İşlem başarısız oldu." }, { status: 400 });
    }
}