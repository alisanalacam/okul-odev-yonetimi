"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon, LinkIcon, DocumentIcon, PhotoIcon, MegaphoneIcon } from '@heroicons/react/24/solid';

// Duyuru türüne göre içeriği render eden yardımcı bileşen
const AnnouncementContent = ({ announcement }: { announcement: any }) => {
    switch (announcement.type) {
        case 'note':
            return <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>;
        case 'link':
            return (
                <div className="space-y-3">
                    <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                    <a href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded-lg hover:bg-indigo-200">
                        <LinkIcon className="h-5 w-5" />
                        <span>Linki Aç</span>
                    </a>
                </div>
            );
        case 'photo':
            return (
                <div className="space-y-3">
                    <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                    <h4 className="font-semibold text-sm text-gray-600">Ekli Dosyalar:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {announcement.attachments?.map((att: any) => (
                            <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer" 
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                {att.fileType.startsWith('image/') ? (
                                    <img src={att.fileUrl} alt={att.fileName} className="w-12 h-12 object-cover rounded flex-shrink-0"/>
                                ) : (
                                    <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded flex-shrink-0">
                                        <DocumentIcon className="h-8 w-8 text-gray-400"/>
                                    </div>
                                )}
                                <p className="text-sm font-medium text-gray-800 truncate">{att.fileName}</p>
                            </a>
                        ))}
                    </div>
                </div>
            );
        default:
            return null;
    }
};

export default function AnnouncementDetailPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const [announcement, setAnnouncement] = useState<any>(null);

    useEffect(() => {
        if(token && id) api.get(`/api/teacher/announcements/${id}`, token).then(setAnnouncement);
    }, [token, id]);

    if (!announcement) return <div className="text-center py-10">Duyuru yükleniyor...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200">
                    <ArrowLeftIcon className="h-6 w-6 text-gray-700"/>
                </button>
                <h2 className="text-2xl font-bold text-gray-800">Duyuru Detayı</h2>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <h1 className="text-xl font-bold text-gray-900">{announcement.title}</h1>
                
                <div className="text-sm text-gray-500">
                    <span>{new Date(announcement.createdAt).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })} tarihinde yayınlandı.</span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <AnnouncementContent announcement={announcement} />
                </div>
            </div>

             <div className="bg-white p-4 rounded-lg shadow">
                 <h3 className="text-md font-semibold text-gray-800 mb-2">İlgili Sınıflar</h3>
                 <div className="flex flex-wrap gap-2">
                    {announcement.announcementClasses.map((ac: any) => (
                        <span key={ac.class.id} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                            {ac.class.grade}-{ac.class.section}
                        </span>
                    ))}
                 </div>
            </div>
        </div>
    );
}