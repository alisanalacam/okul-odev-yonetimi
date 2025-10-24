import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTeacher } from '@/lib/auth-utils';
//@ts-ignore
import { SubmissionStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
    const teacherPayload = await verifyTeacher(request);
    if (teacherPayload instanceof NextResponse) return teacherPayload;

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    if (!classId) {
        return NextResponse.json({ message: "Sınıf ID'si gerekli." }, { status: 400 });
    }

    try {
        
        /*const teacherClasses = await prisma.teacherClass.findMany({
            where: { teacherUserId: teacherPayload.userId },
            select: { classId: true }
        });
        const classIds = teacherClasses.map(tc => tc.classId);*/

        const students = await prisma.student.findMany({
            where: { classId: parseInt(classId) },
            orderBy: { name: 'asc' }
        });
        const studentIds = students.map((s: any) => s.id);

        //@ts-ignore
        const bookLogsCount = await prisma.bookLog.groupBy({
            by: ['studentId'],
            where: { studentId: { in: studentIds } },
            _count: { _all: true }
        });

        const homeworkStatusCount = await prisma.homeworkSubmission.groupBy({
            by: ['studentId', 'status'],
            where: { studentId: { in: studentIds } },
            _count: { _all: true }
        });

        //@ts-ignore
        const bookLogMap = new Map(bookLogsCount.map(item => [item.studentId, item._count._all]));
        const homeworkMap = new Map<number, { completed: number, not_completed: number }>();

        homeworkStatusCount.forEach((item: any) => {
            if (!homeworkMap.has(item.studentId)) {
                homeworkMap.set(item.studentId, { completed: 0, not_completed: 0 });
            }
            const counts = homeworkMap.get(item.studentId)!;
            if (item.status === SubmissionStatus.completed) {
                counts.completed = item._count._all;
            } else if (item.status === SubmissionStatus.not_completed) {
                counts.not_completed = item._count._all;
            }
        });

        const studentsWithStats = students.map((student: any) => ({
            ...student,
            bookLogCount: bookLogMap.get(student.id) || 0,
            completedHomeworkCount: homeworkMap.get(student.id)?.completed || 0,
            notCompletedHomeworkCount: homeworkMap.get(student.id)?.not_completed || 0,
        }));

        return NextResponse.json(studentsWithStats);
    } catch (error) {
        console.error("Öğrenci istatistikleri alınırken hata:", error);
        return NextResponse.json({ message: "Sunucu hatası" }, { status: 500 });
    }
}