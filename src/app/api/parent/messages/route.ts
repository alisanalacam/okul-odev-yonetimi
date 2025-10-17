import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
    const parentPayload = await verifyParent(request);
    if (parentPayload instanceof NextResponse) return parentPayload;
    
    const messages = await prisma.message.findMany({
        where: { OR: [{ senderId: parentPayload.userId }, { receiverId: parentPayload.userId }] },
        orderBy: { createdAt: 'desc' },
        include: { sender: true, receiver: true }
    });

    const conversations: any = {};
    messages.forEach(msg => {
        const otherParty = msg.senderId === parentPayload.userId ? msg.receiver : msg.sender;
        if (!conversations[otherParty.id]) {
            conversations[otherParty.id] = {
                teacher: { id: otherParty.id, name: otherParty.name }, // DEĞİŞİKLİK: 'parent' yerine 'teacher'
                lastMessage: msg.content,
                timestamp: msg.createdAt,
            };
        }
    });

    return NextResponse.json(Object.values(conversations));
}