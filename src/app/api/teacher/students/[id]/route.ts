import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';
//@ts-ignore
import { SubmissionStatus } from '@prisma/client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const teacherPayload = await verifyTeacher(request);
    if (teacherPayload instanceof NextResponse) return teacherPayload;

    try {
        const studentId = parseInt((await params).id);

        // 1. Temel öğrenci ve veli bilgilerini al
        const studentInfo = prisma.student.findUnique({
            where: { id: studentId },
            include: { 
                class: true, 
                parent: { select: { id: true, name: true, email: true } } 
            }
        });

        // 2. Kitap okuma sayısını al
        const bookLogCount = prisma.bookLog.count({ where: { studentId } });

        // 3. Ödev durum sayılarını al (tek sorguda)
        const homeworkStatusCounts = prisma.homeworkSubmission.groupBy({
            by: ['status'],
            where: { studentId },
            _count: { _all: true }
        });

        // 4. Son 5 tamamlanan ödevi al
        const last5Completed = prisma.homeworkSubmission.findMany({
            where: { studentId, status: SubmissionStatus.completed },
            take: 5,
            orderBy: { submittedAt: 'desc' },
            include: { homework: { include: { book: true } } }
        });

        // 5. Son 5 yapılmayan ödevi al
        const last5NotCompleted = prisma.homeworkSubmission.findMany({
            where: { studentId, status: SubmissionStatus.not_completed },
            take: 5,
            orderBy: { submittedAt: 'desc' },
            include: { homework: { include: { book: true } } }
        });

        // Tüm sorguları aynı anda çalıştır
        const [
            student,
            booksRead,
            hwCounts,
            completedHomeworks,
            notCompletedHomeworks
        ] = await Promise.all([
            studentInfo,
            bookLogCount,
            homeworkStatusCounts,
            last5Completed,
            last5NotCompleted
        ]);

        if (!student) {
            return NextResponse.json({ message: "Öğrenci bulunamadı." }, { status: 404 });
        }
        
        // Gelen veriyi formatla
        const stats = {
            //@ts-ignore
            completed: hwCounts.find(c => c.status === SubmissionStatus.completed)?._count._all || 0,
            //@ts-ignore
            not_completed: hwCounts.find(c => c.status === SubmissionStatus.not_completed)?._count._all || 0,
        };

        const responseData = {
            student,
            stats: {
                booksRead,
                completed: stats.completed,
                notCompleted: stats.not_completed,
            },
            completedHomeworks,
            notCompletedHomeworks,
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("Öğrenci detayı alınırken hata:", error);
        return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
    }
}