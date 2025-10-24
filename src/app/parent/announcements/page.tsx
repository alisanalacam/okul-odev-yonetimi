"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { MegaphoneIcon, LinkIcon, PhotoIcon } from '@heroicons/react/24/solid';

const AnnouncementCard = ({ announcement }: { announcement: any }) => {
  const typeInfo = {
    note: { Icon: MegaphoneIcon, color: 'bg-blue-100 text-blue-600' },
    link: { Icon: LinkIcon, color: 'bg-green-100 text-green-600' },
    photo: { Icon: PhotoIcon, color: 'bg-purple-100 text-purple-600' },
  };
  const { Icon, color } = typeInfo[announcement.type as keyof typeof typeInfo];

  return (
    <Link href={`/parent/announcements/${announcement.id}`} className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-full ${color}`}><Icon className="h-6 w-6" /></div>
        <div className="flex-1">
          <p className="font-bold text-gray-900">{announcement.title}</p>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content || 'İçerik için tıklayın'}</p>
          <p className="text-xs text-gray-400 text-right mt-2">{new Date(announcement.createdAt).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>
    </Link>
  );
};

export default function ParentAnnouncementsPage() {
    const { token, selectedStudent } = useAuth();
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        if(token && selectedStudent) {
            setLoading(true);
            api.get(`/api/parent/announcements?studentId=${selectedStudent.id}`, token)
              .then(data => {
                  setAnnouncements(data.announcements);
                  setNextCursor(data.nextCursor);
              })
              .finally(() => setLoading(false));
        }
    }, [token, selectedStudent]);

    const handleLoadMore = () => {
      if (!token || !selectedStudent || !nextCursor) return;
      setIsLoadingMore(true);
      api.get(`/api/parent/announcements?studentId=${selectedStudent.id}&cursor=${nextCursor}`, token)
         .then(data => {
             setAnnouncements(prev => [...prev, ...data.announcements]);
             setNextCursor(data.nextCursor);
         })
         .finally(() => setIsLoadingMore(false));
    };

    return (
        <div className="space-y-5">
            <h2 className="text-2xl font-bold text-gray-800">Duyurular</h2>
            {loading ? <p className="text-center text-gray-500 dark:text-gray-400 py-4">Yükleniyor...</p> : (
                announcements.length > 0 ? (
                    <div className="space-y-3">
                        {announcements.map(announcement => (
                            <AnnouncementCard key={announcement.id} announcement={announcement} />
                        ))}
                        {nextCursor && (
                            <button onClick={handleLoadMore} disabled={isLoadingMore} className="btn-secondary w-full">
                                {isLoadingMore ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                            </button>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Gösterilecek duyuru bulunmuyor.</p>
                )
            )}
        </div>
    );
}