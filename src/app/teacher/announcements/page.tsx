"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { PlusIcon, MegaphoneIcon, LinkIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/solid';

const AnnouncementCard = ({ announcement, onDelete }: { announcement: any, onDelete: (id: number) => void }) => {
  const typeInfo = {
    note: { Icon: MegaphoneIcon, color: 'bg-blue-100 text-blue-600' },
    link: { Icon: LinkIcon, color: 'bg-green-100 text-green-600' },
    photo: { Icon: PhotoIcon, color: 'bg-purple-100 text-purple-600' },
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Link'e tıklamayı engelle
    e.stopPropagation(); // Olayın daha fazla yayılmasını durdur
    onDelete(announcement.id);
  };

  const { Icon, color } = typeInfo[announcement.type as keyof typeof typeInfo];

  return (
    <div className="relative">
    <Link href={`/teacher/announcements/${announcement.id}`} className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 dark:text-gray-700">{announcement.title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-600 mt-1 line-clamp-2">{announcement.content || 'İçerik yok'}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {announcement.announcementClasses.map((ac: any) => (
              <span key={ac.class.id} className="text-xs bg-gray-200 px-2 py-1 rounded-full dark:text-gray-600">{ac.class.grade}-{ac.class.section}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-right mt-2">{new Date(announcement.createdAt).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>
    </Link>
    <button onClick={handleDeleteClick} className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default function AnnouncementsPage() {
    const { token } = useAuth();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        if(token) {
            api.get('/api/teacher/announcements', token)
               .then(data => {
                  setAnnouncements(data.announcements);
                  setNextCursor(data.nextCursor);
              })
               .finally(() => setLoading(false));
        }
    }, [token]);

    const handleDelete = async (id: number) => {
        if (confirm("Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
            try {
                await api.delete(`/api/teacher/announcements/${id}`, token!);
                // State'i anında güncelle
                setAnnouncements(prev => prev.filter(a => a.id !== id));
            } catch (error) {
                alert("Duyuru silinemedi.");
            }
        }
    };

    const handleLoadMore = () => {
      if (!token || !nextCursor) return;
      setIsLoadingMore(true);
      api.get(`/api/teacher/announcements?cursor=${nextCursor}`, token)
         .then(data => {
             setAnnouncements(prev => [...prev, ...data.announcements]);
             setNextCursor(data.nextCursor);
         })
         .finally(() => setIsLoadingMore(false));
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center">
                <Link href="/teacher/announcements/add" className="flex items-center justify-center w-full gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-colors">
                    <PlusIcon className="h-6 w-6" />
                    Yeni Duyuru Ekle
                </Link>
            </div>

            {loading ? <p className="text-center text-gray-500 dark:text-gray-400 py-4">Yükleniyor...</p> : (
                <div className="space-y-3">
                    {announcements.map(announcement => (
                        <AnnouncementCard key={announcement.id} announcement={announcement} onDelete={handleDelete} />
                    ))}
                    {nextCursor && (
                        <button onClick={handleLoadMore} disabled={isLoadingMore} className="btn-secondary w-full">
                            {isLoadingMore ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}