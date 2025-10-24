"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function ParentMessagesListPage() {
    const { token } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Bu API'ı kopyala-yapıştır ile oluşturmanız gerekecek.
        if(token) api.get('/api/parent/messages', token).then(setConversations).finally(() => setLoading(false));
    }, [token]);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-900">Mesajlar</h2>
            <div className="space-y-3">
                {loading ? <p className="text-center text-gray-500 dark:text-gray-400 py-4">Yükleniyor...</p> : conversations.length > 0 ? conversations.map(conv => (
                    <Link key={conv.teacher.id} href={`/parent/messages/${conv.teacher.id}`} className="block bg-white p-4 rounded-lg shadow hover:bg-gray-50">
                        <p className="font-bold dark:text-gray-700">{conv.teacher.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{conv.lastMessage}</p>
                    </Link>
                )) : <p>Henüz bir görüşmeniz yok.</p>}
            </div>
        </div>
    );
}