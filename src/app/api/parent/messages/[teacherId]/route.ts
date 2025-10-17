import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
    const parentPayload = await verifyParent(request);
    if (parentPayload instanceof NextResponse) return parentPayload;
    
    const teacherId = parseInt((await params).teacherId);
    const parentId = parentPayload.userId;

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: teacherId, receiverId: parentId },
                { senderId: parentId, receiverId: teacherId }
            ]
        },
        include: { sender: { select: { name: true, role: true } }, receiver: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(messages);
}

// Yeni mesaj gönder
export async function POST(request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
    const parentPayload = await verifyParent(request);
    if (parentPayload instanceof NextResponse) return parentPayload;
    
    const teacherId = parseInt((await params).teacherId);
    const { content } = await request.json();

    const message = await prisma.message.create({
        data: {
            senderId: parentPayload.userId,
            receiverId: teacherId,
            content: content
        }
    });

    // Veliye bildirim gönder
    await prisma.notification.create({
        data: { userId: teacherId, type: 'message', referenceId: parentPayload.userId }
    });
    
    return NextResponse.json(message, { status: 201 });
}