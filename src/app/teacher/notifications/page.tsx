"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

// Öğretmen için bildirim mesajlarını oluşturan yardımcı fonksiyon
const getTeacherNotificationMessage = (n: any) => {
    if (n.type === 'comment' && n.context.homeworkName && n.context.commenterName) {
        return `${n.context.homeworkName} isimli ödeve ${n.context.commenterName} yorum yaptı.`;
    }
    if (n.type === 'message' && n.context.senderName) {
        return `${n.context.senderName} isimli veliden yeni bir mesajınız var.`;
    }
    return "Yeni bir bildiriminiz var.";
};

// Öğretmen için bildirim linkini oluşturan yardımcı fonksiyon
const getTeacherNotificationLink = (n: any) => {
    // Yorum bildirimi, öğretmeni submission detayına götürür.
    if (n.type === 'comment') return `/teacher/submission/${n.referenceId}`; 
    if (n.type === 'message') return `/teacher/messages/${n.referenceId}`;
    return '#';
}

export default function TeacherNotificationsPage() {
    const { token, unreadCount, setUnreadCount } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        if (!token) return;
        setIsLoading(true);
        api.get('/api/notifications', token).then(data => {
            setNotifications(data.notifications);
            setNextCursor(data.nextCursor);
            setIsLoading(false);
        });
        // Sayfa açıldığında tümünü okundu olarak işaretle
        //api.post('/api/notifications/mark-as-read', token, {});
    }, [token]);

    const handleLoadMore = () => {
        if (!token || !nextCursor) return;
        setIsLoadingMore(true);
        api.get(`/api/notifications?cursor=${nextCursor}`, token).then(data => {
            setNotifications(prev => [...prev, ...data.notifications]);
            setNextCursor(data.nextCursor);
            setIsLoadingMore(false);
        });
    };

    const handleNotificationClick = (notification: any) => {
        // Eğer zaten okunmuşsa bir şey yapma
        if (notification.isRead) return;

        setUnreadCount(prev => Math.max(0, prev - 1));

        // 1. Anında görsel geri bildirim için arayüzü güncelle (Optimistic UI Update)
        setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );

        // 2. Arka planda API'ı çağırarak veritabanını güncelle
        api.post(`/api/notifications/${notification.id}/read`, token!, {})
           .catch(err => console.error("Bildirim okundu olarak işaretlenemedi:", err));
    };

    const handleMarkAllAsRead = () => {
        if (confirm("Tüm bildirimleri okundu olarak işaretlemek istediğinizden emin misiniz?")) {
            api.post('/api/notifications/mark-as-read', token!, {})
                .then(() => {
                    // Arayüzü anında güncelle
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    // Global sayacı sıfırla
                    setUnreadCount(0);
                })
                .catch(err => alert("İşlem sırasında bir hata oluştu."));
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200"><ArrowLeftIcon className="h-6 w-6 text-gray-700"/></button>
                    <h2 className="text-2xl font-bold">Bildirimler</h2>
                </div>
                <button onClick={handleMarkAllAsRead} className="text-sm font-medium text-blue-600 hover:underline">
                    Tümünü Okundu Yap
                </button>
            </div>
            <div className="space-y-3">
                {isLoading ? <p>Yükleniyor...</p> : notifications.length > 0 ? notifications.map(n => (
                    <Link key={n.id} href={getTeacherNotificationLink(n)} 
                    onClick={() => handleNotificationClick(n)}
                    className={`block p-4 rounded-lg shadow ${!n.isRead ? 'bg-blue-50 border border-blue-200' : 'bg-white'}`}>
                        <p className="font-semibold">{getTeacherNotificationMessage(n)}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </Link>
                )) : <p className="text-center text-gray-500 py-4">Yeni bildiriminiz yok.</p>}
                {nextCursor && (
                    <button onClick={handleLoadMore} disabled={isLoadingMore} className="btn-secondary w-full">
                        {isLoadingMore ? 'Yükleniyor...' : 'Daha Fazla Yükle'}
                    </button>
                )}
            </div>
        </div>
    );
}