// src/app/parent/announcements/[id]/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon, LinkIcon } from '@heroicons/react/24/solid';

const AnnouncementContent = ({ announcement }: { announcement: any }) => {
    switch (announcement.type) {
        case 'note': return <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>;
        case 'link': return (
            <div className="space-y-3"><p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p><a href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded-lg hover:bg-indigo-200"><LinkIcon className="h-5 w-5" /><span>Linki Aç</span></a></div>);
        case 'photo': return (
            <div className="space-y-3">
                <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
                <div className="grid grid-cols-2 gap-3 mt-2">
                    {announcement.photos?.map((photo: any) => (
                        <a key={photo.id} href={photo.photoUrl} target="_blank" rel="noopener noreferrer">
                            <img src={photo.photoUrl} alt="Duyuru Fotoğrafı" className="w-full h-32 object-cover rounded-lg"/>
                        </a>
                    ))}
                </div>
            </div>);
        default: return null;
    }
};

export default function ParentAnnouncementDetailPage() {
    const { token } = useAuth();
    const router = useRouter();
    const { id } = useParams();
    const [announcement, setAnnouncement] = useState<any>(null);

    useEffect(() => {
        if(token && id) api.get(`/api/announcements/${id}`, token).then(setAnnouncement);
    }, [token, id]);

    if (!announcement) return <div className="text-center py-10">Duyuru yükleniyor...</div>;

    return (
        <div className="space-y-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium"><ArrowLeftIcon className="h-5 w-5"/> Geri</button>
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <h1 className="text-xl font-bold text-gray-900">{announcement.title}</h1>
                <div className="border-t border-gray-200 pt-4"><AnnouncementContent announcement={announcement} /></div>
            </div>
        </div>
    );
}