"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useRouter, useParams } from 'next/navigation';

export default function StudentBookLogsPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const studentId = params.id;

    const [logs, setLogs] = useState<any[]>([]);
    const [studentName, setStudentName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && studentId) {
            api.get(`/api/teacher/students/${studentId}/book-logs`, token)
               .then(data => {
                   setLogs(data.logs);
                   setStudentName(data.studentName);
               })
               .finally(() => setLoading(false));
        }
    }, [token, studentId]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-600">
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700 dark:text-gray-600"/>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-500">{studentName} - Okuduğu Kitaplar</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toplam {logs.length} kitap</p>
                </div>
            </div>

            {loading ? <p className="text-center text-gray-500 py-4 dark:text-gray-400">Kitap listesi yükleniyor...</p> : (
                <div className="space-y-3">
                    {logs.length > 0 ? (
                        logs.map(log => (
                            <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{log.bookName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4">{new Date(log.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                </div>
                                {log.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">{log.description}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
                            <p>Bu öğrenci henüz hiç kitap okuma kaydı eklememiş.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}