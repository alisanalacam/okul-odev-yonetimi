"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PaperAirplaneIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';

interface Comment {
  id: number;
  commentText: string;
  createdAt: string;
  user: { name: string; role: 'teacher' | 'parent' };
}
interface CommentsSectionProps {
  submissionId: number;
  comments: Comment[];
  recipientId: number;
  apiEndpoint: string;
  getLatestData: () => void;
}

export default function CommentsSection({ submissionId, comments, recipientId, apiEndpoint, getLatestData }: CommentsSectionProps) {
  const { user, token } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      // API endpoint'ini prop olarak alarak hem veli hem öğretmen için çalışmasını sağlıyoruz
      await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token!}`,
        },
        body: JSON.stringify({
          submissionId: submissionId,
          commentText: newComment,
          // Bildirimin kime gideceğini belirtiyoruz
          teacherUserId: recipientId, // Veli gönderiyorsa
          parentUserId: recipientId,  // Öğretmen gönderiyorsa
        }),
      });
      setNewComment('');
      // Yorum gönderildikten sonra en güncel veriyi çekmek için parent component'teki fonksiyonu çağır
      getLatestData();
    } catch (error) {
      console.error("Yorum gönderilemedi:", error);
      alert("Yorum gönderilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800">
        <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-indigo-500" />
        Yorumlar
      </h3>
      
      {/* Yorum Listesi */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {comments.map((comment) => (
          <div key={comment.id} className={`flex gap-2.5 ${comment.user.role === user?.role ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-fit max-w-[80%] p-3 rounded-2xl ${comment.user.role === user?.role ? 'bg-indigo-600 text-white rounded-br-lg' : 'bg-gray-100 text-gray-800 rounded-bl-lg'}`}>
              <p className="font-bold text-sm">{comment.user.name}</p>
              <p className="text-base break-words">{comment.commentText}</p>
              <p className={`text-xs opacity-70 mt-1 ${comment.user.role === user?.role ? 'text-right' : 'text-left'}`}>
                {new Date(comment.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-4">Henüz yorum yapılmamış.</p>
        )}
      </div>

      {/* Yorum Yazma Formu */}
      <form onSubmit={handleCommentSubmit} className="mt-4 flex gap-2 border-t pt-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Yorumunuzu yazın..."
          className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button type="submit" disabled={isSubmitting || !newComment.trim()} className="p-3 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700 disabled:bg-indigo-300">
          <PaperAirplaneIcon className="h-6 w-6" />
        </button>
      </form>
    </div>
  );
}