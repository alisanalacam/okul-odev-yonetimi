"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, PaperClipIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';

export default function SubmissionDetailPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { id } = params;
    const parentId = searchParams.get('parentId');

    const [submission, setSubmission] = useState<any>(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if(token && id) api.get(`/api/teacher/submissions/${id}`, token).then(setSubmission);
    }, [token, id]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!comment.trim()) return;
        setIsSubmitting(true);
        try {
            await api.post('/api/teacher/comments', token!, {
                submissionId: submission.id,
                commentText: comment,
                parentUserId: Number(parentId)
            });
            setComment('');
            // Yorum listesini anlık güncelle
            api.get(`/api/teacher/submissions/${id}`, token!).then(setSubmission);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if(!submission) return <div>Yükleniyor...</div>;

    const StatusInfo = submission.status === 'completed' 
        ? { Icon: CheckCircleIcon, text: 'Ödev Yapıldı', color: 'text-green-500' }
        : { Icon: XCircleIcon, text: 'Ödev Yapılmadı', color: 'text-red-500' };

    return (
        <div className="space-y-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-black"><ArrowLeftIcon className="h-5 w-5"/> Geri</button>
            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="font-bold text-xl">{submission.student.name}</h2>
                <p className="text-gray-600">{submission.homework.book.name} Ödevi</p>
                <div className={`flex items-center gap-2 mt-3 ${StatusInfo.color}`}>
                    <StatusInfo.Icon className="h-6 w-6" />
                    <span className="font-semibold">{StatusInfo.text}</span>
                </div>
                <p className="text-gray-600">{submission.notes}</p>
            </div>

            {submission.parentNotes && (
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Veli Notu</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{submission.parentNotes}</p>
                </div>
            )}
            
            {submission.photos.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Eklenen Fotoğraflar</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {submission.photos.map((photo: any) => (
                            <a key={photo.id} href={photo.photoUrl} target="_blank" rel="noopener noreferrer">
                                <img src={photo.photoUrl} alt="ödev fotoğrafı" className="w-full h-32 object-cover rounded-md"/>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-indigo-500"/> Yorumlar</h3>
                <div className="space-y-4">
                    {submission.comments.map((c: any) => (
                        <div key={c.id} className={`flex gap-2 ${c.user.role === 'teacher' ? 'justify-end' : ''}`}>
                            <div className={`max-w-xs p-3 rounded-lg ${c.user.role === 'teacher' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="font-bold text-sm">{c.user.name}</p>
                                <p>{c.commentText}</p>
                                <p className="text-xs text-right opacity-70 mt-1">{new Date(c.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-2">
                    <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Yorumunuzu yazın..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-sm text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">Gönder</button>
                </form>
            </div>
        </div>
    );
}