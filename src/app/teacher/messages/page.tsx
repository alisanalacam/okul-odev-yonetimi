"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';

export default function MessagesListPage() {
    const { token } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    
    useEffect(() => {
        if(token) api.get('/api/teacher/messages', token).then(setConversations);
    }, [token]);

    return (
        <div>
            <div className="space-y-3">
                {conversations.map(conv => (
                    <Link key={conv.parent.id} href={`/teacher/messages/${conv.parent.id}`} className="block bg-white p-4 rounded-lg shadow hover:bg-gray-50">
                        <p className="font-bold dark:text-gray-700">{conv.parent.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{conv.lastMessage}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}