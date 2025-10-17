import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';

const NOTIFICATIONS_PER_PAGE = 2;

// Hem veli hem öğretmen kullanacağı için ortak bir endpoint yapıyoruz
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({}, { status: 401 });
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number, role: string };
    
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');

    const notifications = await prisma.notification.findMany({
        take: NOTIFICATIONS_PER_PAGE,
        ...(cursor ? { skip: 1, cursor: { id: parseInt(cursor) } } : {}),
        where: { userId: payload.userId },
        orderBy: { id: 'desc' }, // Cursor pagination için sıralama önemli
    });

    // Her bildirim için ilgili veriyi çekip "context" objesi oluştur
    const notificationsWithContext = await Promise.all(
        notifications.map(async (n) => {
            let context: any = {};
            if (n.type === 'comment') {
                const submission = await prisma.homeworkSubmission.findUnique({
                    where: { id: n.referenceId },
                    include: {
                        homework: { include: { book: true } },
                        comments: { where: { userId: { not: payload.userId } }, orderBy: { createdAt: 'desc' }, take: 1, include: { user: { select: { name: true } } } }
                    }
                });
                if (submission) {
                    context.homeworkName = submission.homework.book.name;
                    context.commenterName = submission.comments[0]?.user.name;
                }
            } else if (n.type === 'message') {
                const message = await prisma.message.findFirst({
                    where: { OR: [{ senderId: n.referenceId, receiverId: payload.userId }, { senderId: payload.userId, receiverId: n.referenceId }] },
                    include: { receiver: { select: { name: true } } }
                });
                if (message) {
                    context.senderName = message.receiver.name;
                }
            } else if (n.type === 'announcement') {
                const announcement = await prisma.announcement.findUnique({
                    where: { id: n.referenceId },
                    select: { title: true }
                });
                if (announcement) {
                    context.title = announcement.title;
                }
            }
            return { ...n, context };
        })
    );
    
    const nextCursor = notifications.length === NOTIFICATIONS_PER_PAGE ? notifications[NOTIFICATIONS_PER_PAGE - 1].id : null;

    return NextResponse.json({
        notifications: notificationsWithContext,
        nextCursor,
    });
}