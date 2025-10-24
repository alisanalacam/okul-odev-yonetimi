"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { BookOpenIcon, CheckBadgeIcon, XCircleIcon } from '@heroicons/react/24/solid';

export default function TeacherStudentsPage() {
    const { token } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    

    useEffect(() => {
        const classId = localStorage.getItem('selectedClassId');
        if (token && classId) {
            api.get('/api/teacher/students?classId=' + classId, token)
               .then(setStudents)
               .finally(() => setLoading(false));
        }
    }, [token]);

    return (
        <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-800">Öğrenci Listesi</h2>
            {loading ? <p>Öğrenci listesi yükleniyor...</p> : (
                <div className="space-y-3">
                    {students.map(student => (
                        <Link key={student.id} href={`/teacher/students/${student.id}`} className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-lg text-gray-900">{student.name}</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-gray-600" title="Okunan Kitap Sayısı">
                                        <BookOpenIcon className="h-5 w-5 text-blue-500"/>
                                        <span>{student.bookLogCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-600" title="Yapılan Ödev Sayısı">
                                        <CheckBadgeIcon className="h-5 w-5 text-green-500"/>
                                        <span>{student.completedHomeworkCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-600" title="Yapılmayan Ödev Sayısı">
                                        <XCircleIcon className="h-5 w-5 text-red-500"/>
                                        <span>{student.notCompletedHomeworkCount}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}