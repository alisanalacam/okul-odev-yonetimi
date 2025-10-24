"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { ArrowLeftIcon, BookOpenIcon, CheckBadgeIcon, XCircleIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid';

// Tekrar kullanılabilir istatistik kartı
const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
        <div className={`p-3 rounded-full ${colorClass.bg}`}>
            <Icon className={`h-6 w-6 ${colorClass.text}`} />
        </div>
        <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

// Tekrar kullanılabilir ödev listesi item'ı
const HomeworkListItem = ({ submission }: { submission: any }) => (
    <Link href={`/teacher/submission/${submission.id}?parentId=${submission.student?.parentUserId}`} className="block p-3 hover:bg-gray-50 rounded-md">
        <div className="flex justify-between items-center">
            <div>
                <p className="font-semibold text-gray-800">{submission.homework.book.name}</p>
                <p className="text-xs text-gray-500">{submission.homework.notes}</p>
            </div>
            <p className="text-xs text-gray-400">{new Date(submission.submittedAt).toLocaleDateString('tr-TR')}</p>
        </div>
    </Link>
);


export default function StudentDetailPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && id) {
            api.get(`/api/teacher/students/${id}`, token)
               .then(setData)
               .finally(() => setLoading(false));
        }
    }, [token, id]);

    if (loading) return <div className="text-center py-10">Öğrenci verileri yükleniyor...</div>;
    if (!data) return <div className="text-center py-10">Öğrenci bulunamadı.</div>;

    const { student, stats, completedHomeworks, notCompletedHomeworks } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200">
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700"/>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
                    <p className="text-sm text-gray-500">{student.class.grade}-{student.class.section} Sınıfı</p>
                </div>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Okunan Kitap" value={stats.booksRead} icon={BookOpenIcon} colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }} />
                <StatCard title="Tamamlanan Ödev" value={stats.completed} icon={CheckBadgeIcon} colorClass={{ bg: 'bg-green-100', text: 'text-green-600' }} />
                <StatCard title="Yapılmayan Ödev" value={stats.notCompleted} icon={XCircleIcon} colorClass={{ bg: 'bg-red-100', text: 'text-red-600' }} />
            </div>
            
            {/* Veliye Mesaj Butonu */}
            <Link href={`/teacher/messages/${student.parent.id}?studentId=${student.id}`} className="btn-primary w-full flex items-center justify-center gap-2">
                <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5"/>
                <span>{student.parent.name} (Veli) ile Mesajlaş</span>
            </Link>

            {/* Ödev Listeleri */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Son Tamamlanan Ödevler */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold text-gray-800 mb-2">Son Tamamlanan 5 Ödev</h3>
                    <div className="divide-y divide-gray-100">
                        {completedHomeworks.length > 0 ? (
                            completedHomeworks.map((sub: any) => <HomeworkListItem key={sub.id} submission={sub} />)
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Tamamlanmış ödev bulunmuyor.</p>
                        )}
                    </div>
                </div>

                {/* Son Yapılmayan Ödevler */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold text-gray-800 mb-2">Son Yapılmayan 5 Ödev</h3>
                    <div className="divide-y divide-gray-100">
                        {notCompletedHomeworks.length > 0 ? (
                            notCompletedHomeworks.map((sub: any) => <HomeworkListItem key={sub.id} submission={sub} />)
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Yapılmamış ödev bulunmuyor.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}