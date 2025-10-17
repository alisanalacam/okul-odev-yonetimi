import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
    const teacherPayload = await verifyTeacher(request);
    if (teacherPayload instanceof NextResponse) return teacherPayload;
    
    // Öğretmenin dahil olduğu tüm mesajları çek
    const messages = await prisma.message.findMany({
        where: { OR: [{ senderId: teacherPayload.userId }, { receiverId: teacherPayload.userId }] },
        orderBy: { createdAt: 'desc' },
        include: { sender: true, receiver: true }
    });

    // Mesajları veliye göre grupla ve son mesajı al
    const conversations: any = {};
    messages.forEach(msg => {
        const otherParty = msg.senderId === teacherPayload.userId ? msg.receiver : msg.sender;
        if (!conversations[otherParty.id]) {
            conversations[otherParty.id] = {
                parent: { id: otherParty.id, name: otherParty.name },
                lastMessage: msg.content,
                timestamp: msg.createdAt,
                unreadCount: 0 // Bu mantık daha sonra eklenebilir
            };
        }
    });

    return NextResponse.json(Object.values(conversations));
}