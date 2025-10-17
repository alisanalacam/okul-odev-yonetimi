import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';

// Mesaj geçmişini getir
export async function GET(request: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
    const teacherPayload = await verifyTeacher(request);
    if (teacherPayload instanceof NextResponse) return teacherPayload;
    
    const parentId = parseInt((await params).parentId);
    const teacherId = teacherPayload.userId;

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
export async function POST(request: NextRequest, { params }: { params: Promise<{ parentId: string }> }) {
    const teacherPayload = await verifyTeacher(request);
    if (teacherPayload instanceof NextResponse) return teacherPayload;
    
    const parentId = parseInt((await params).parentId);
    const { content } = await request.json();

    const message = await prisma.message.create({
        data: {
            senderId: teacherPayload.userId,
            receiverId: parentId,
            content: content
        }
    });

    // Veliye bildirim gönder
    await prisma.notification.create({
        data: { userId: parentId, type: 'message', referenceId: teacherPayload.userId }
    });
    
    return NextResponse.json(message, { status: 201 });
}