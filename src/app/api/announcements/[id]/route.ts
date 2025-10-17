import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest, { params }: { params: { id:string } }) {
    // Token'ı alıp yetki kontrolü yapabiliriz ama duyuru detayı genellikle public olabilir.
    // Şimdilik token gerektirmeden çalışsın.
    const announcement = await prisma.announcement.findUnique(
        { 
            where: { id: parseInt(params.id) } ,
            include: { photos: true }
        },
    );
    if (!announcement) return NextResponse.json({ message: "Duyuru bulunamadı" }, { status: 404 });
    return NextResponse.json(announcement);
}