"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon, BookOpenIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

export default function BookLogPage() {
    const { token, selectedStudent } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);
    const [bookName, setBookName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBookForm, setShowBookForm] = useState(false);

    useEffect(() => {
        if (token && selectedStudent) {
            api.get(`/api/parent/book-logs?studentId=${selectedStudent.id}`, token).then(setLogs);
        }
    }, [token, selectedStudent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const newLog = await api.post('/api/parent/book-logs', token!, {
                studentId: selectedStudent!.id,
                bookName,
                description
            });
            setLogs(prev => [newLog, ...prev]); // Yeni kaydı listenin başına ekle
            setBookName('');
            setDescription('');
            setShowBookForm(false);
        } catch (error) {
            alert("Kitap kaydı eklenemedi.");
        } finally {
            setIsSubmitting(false);
            setShowBookForm(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Bu kitap kaydını silmek istediğinizden emin misiniz?')) {
            try {
                await api.delete(`/api/parent/book-logs/${id}`, token!);
                setLogs(logs.filter(log => log.id !== id));
            } catch (error) { alert('Silme işlemi başarısız oldu.'); }
        }
    };

    if (!selectedStudent) return <div>Önce bir öğrenci seçmelisiniz...</div>;

    return (
        <div className="space-y-6">
            {!showBookForm && (
            <div>
                <button onClick={() => setShowBookForm(!showBookForm)} className="bg-blue-500 text-white px-4 py-3 rounded-full text-sm font-medium">Kitap Ekle</button>
            </div>
            )}
            {showBookForm && (
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Okunan Kitabı Ekle</h2>
                <div>
                    <label htmlFor="bookName" className="block text-sm font-medium text-gray-700">Kitap Adı*</label>
                    <input id="bookName" type="text" value={bookName} onChange={e => setBookName(e.target.value)} required className="w-full p-2 border rounded"/>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Kısa Açıklama (Opsiyonel)</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-2 border rounded"/>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
                    <PlusIcon className="h-5 w-5"/> {isSubmitting ? 'Ekleniyor...' : 'Kaydet'}
                </button>
                <button onClick={() => setShowBookForm(!showBookForm)} className="bg-red-500 text-white px-4 py-3 rounded-full text-sm font-medium">İptal</button>
            </form>
            )}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700">Okunan Kitap Listesi ({logs.length})</h3>
                {logs.map(log => (
                    <div key={log.id} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <p className="font-bold text-gray-900">{log.bookName}</p>
                            <p className="text-xs text-gray-500">
                            <span>{new Date(log.createdAt).toLocaleDateString('tr-TR')}</span>
                            <button onClick={() => handleDelete(log.id)} className="bg-red-500 ml-2 text-white px-1 py-1 rounded-full text-sm font-medium">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                            </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}