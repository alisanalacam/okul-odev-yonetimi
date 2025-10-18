import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({}, { status: 401 });
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    
    const { playerId } = await request.json();
    if (!playerId) return NextResponse.json({ message: "Player ID gerekli" }, { status: 400 });

    await prisma.user.update({
        where: { id: payload.userId },
        //@ts-ignore
        data: { oneSignalPlayerId: playerId },
    });
    
    return NextResponse.json({ success: true });
}