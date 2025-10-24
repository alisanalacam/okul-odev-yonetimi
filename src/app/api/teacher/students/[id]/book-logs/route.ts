import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const teacherPayload = await verifyTeacher(request);
    if (teacherPayload instanceof NextResponse) return teacherPayload;

    try {
        const studentId = parseInt((await params).id);

        // İlgili öğrencinin varlığını ve öğretmenin bu öğrenciyi görme yetkisini kontrol etmek için
        // bir güvenlik katmanı eklenebilir. Şimdilik direkt logları çekiyoruz.

        const bookLogs = await prisma.bookLog.findMany({
            where: {
                studentId: studentId,
            },
            orderBy: {
                createdAt: 'desc', // En yeniden eskiye doğru sırala
            },
        });

        // Öğrencinin adını da başlıkta göstermek için getirelim
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { name: true }
        });

        return NextResponse.json({
            studentName: student?.name || 'Öğrenci',
            logs: bookLogs
        });

    } catch (error) {
        console.error("Öğrencinin kitap kayıtları alınırken hata:", error);
        return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
    }
}