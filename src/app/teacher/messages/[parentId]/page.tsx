"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

export default function ConversationPage() {
    const { token, user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const { parentId } = params;
    const [messages, setMessages] = useState<any[]>([]);
    const [content, setContent] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        if(token && parentId) api.get(`/api/teacher/messages/${parentId}`, token).then(setMessages);
    }, [token, parentId]);

    useEffect(() => { // Mesajlar yüklenince en alta kaydır
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!content.trim()) return;
        const tempId = Date.now();
        const newMsg = { id: tempId, senderId: user!.id, content };
        setMessages(prev => [...prev, newMsg]);
        setContent('');
        try {
            const sentMessage = await api.post(`/api/teacher/messages/${parentId}`, token!, { content });
            // Geçici mesajı gerçek mesajla değiştir
            setMessages(prev => prev.map(m => m.id === tempId ? sentMessage : m));
        } catch {
            // Hata durumunda gönderilemeyen mesajı kaldırabilir veya işaretleyebiliriz
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => router.push('/teacher/messages')} className="p-2 rounded-full hover:bg-gray-200"><ArrowLeftIcon className="h-6 w-6 text-gray-700"/></button>
                <h2 className="text-xl font-bold dark:text-gray-900">Sohbet</h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-100 rounded-lg">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg ${msg.senderId === user?.id ? 'bg-indigo-500 text-white' : 'bg-white text-gray-800 shadow'}`}>
                            <div className="font-bold">{msg.sender?.name ? msg.sender.name : user?.name}</div>
                            <div className="text-sm break-words">{msg.content}</div>
                            <div className={`mt-3 text-xs ${msg.senderId === user?.id ? 'text-white' : 'text-gray-800'}`}>{new Date(msg.createdAt).toLocaleString('tr-TR')}</div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="mt-4 flex gap-2">
                <input type="text" value={content} onChange={e => setContent(e.target.value)} placeholder="Mesajınızı yazın..." className="w-full border-white-300 bg-white rounded-lg dark:text-gray-800 shadow-sm p-3 pl-10 text-base focus:ring-indigo-500 focus:border-indigo-500"/>
                <button type="submit" className="p-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"><PaperAirplaneIcon className="h-6 w-6"/></button>
            </form>
        </div>
    );
}