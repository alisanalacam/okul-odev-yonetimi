"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
/*import { ArrowLeftIcon, UsersIcon, UserPlusIcon, UserMinusIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid';*/
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ChatBubbleOvalLeftEllipsisIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/solid';

// Tekrar kullanılabilir Widget bileşeni
const StatWidget = ({ title, count, icon: Icon, color, isActive, onClick }: any) => (
  <div
  onClick={onClick}
  className={`cursor-pointer rounded-lg p-4 shadow-md transition-all duration-200 
    ${isActive ? 'bg-blue-500 bg-opacity-20 text-white' : 'bg-white hover:bg-gray-50'}
  `}
  >
  <div className="flex flex-col items-center text-center space-y-2">
    {/* Icon */}
    <Icon className={`h-10 w-10 ${color}`} />

    {/* Sayı */}
    <div className="text-2xl font-bold">{count}</div>

    {/* Başlık */}
    <div className={`text-sm text-gray-600 ${isActive ? 'text-white' : 'text-gray-600'}`}>{title}</div>
  </div>
  </div>
);

const renderNotes = (notes: string) => {
  // http veya https ile başlayan linkleri bulur
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = notes.split(urlRegex)

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {part}
        </a>
      )
    }
    return <span key={index}>{part}</span>
  })
}


// Öğrenci satırındaki durum rozeti
const StatusBadge = ({ status }: { status: string }) => {
  const styles: { [key: string]: string } = {
    completed: 'bg-green-100 text-green-800',
    not_completed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };
  const text: { [key: string]: string } = {
    completed: 'Yaptı',
    not_completed: 'Yapmadı',
    pending: 'Bekleniyor',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{text[status]}</span>;
};

export default function HomeworkDetailPage() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [homework, setHomework] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'completed' | 'not_completed' | 'pending'>('pending');

  useEffect(() => {
    if (token && id) {
      api.get(`/api/teacher/homeworks/${id}`, token)
        .then(setHomework)
        .catch(err => console.error("Ödev detayı yüklenemedi", err))
        .finally(() => setLoading(false));
    }
  }, [token, id]);

  const isPastDue = useMemo(() => {
    if (!homework) return false;
    // Saat farklarını hesaba katmadan sadece güne göre karşılaştırma
    const dueDate = new Date(homework.dueDate);
    dueDate.setHours(23, 59, 59, 999); // Ödev gününün sonuna ayarla
    return new Date() > dueDate;
  }, [homework]);

  const filteredStudents = useMemo(() => {
    if (!homework?.students) return [];
    
    const studentsWithFinalStatus = homework.students.map((student: any) => ({
        ...student,
        finalStatus: isPastDue && student.status === 'pending' ? 'not_completed' : student.status
    }));

    if (filter === 'pending') {
        // "Bitirmeyenler" filtresi, ödevin günü geçmiş olsa bile orijinal 'pending' durumuna göre çalışır.
        return studentsWithFinalStatus.filter((student: any) => student.status === 'pending');
    }
    
    // "Yapanlar" ve "Yapmayanlar" filtreleri, günü geçmiş ödevleri de hesaba katan 'finalStatus'e göre çalışır.
    return studentsWithFinalStatus.filter((student: any) => student.finalStatus === filter);

  }, [homework, filter, isPastDue]);

  if (loading) return <div className="text-center py-10 dark:text-gray-900">Ödev detayları yükleniyor...</div>;
  if (!homework) return <div className="text-center py-10 dark:text-gray-900">Ödev bulunamadı.</div>;

  const counts = {
    completed: homework.students.filter((s: any) => s.status === 'completed').length,
    not_completed: homework.students.filter((s: any) => s.status === 'not_completed').length,
    pending: homework.students.filter((s: any) => s.status === 'pending').length,
  };

  const handleDeleteHomework = async () => {

    if (confirm("Bu ödevi ve tüm teslimlerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      try {
        await api.delete(`/api/teacher/homeworks/${id}`, token!);
        // Arayüzden anında kaldır
        router.push('/teacher');
      } catch (error) {
        alert("Ödev silinirken bir hata oluştu.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200">
            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{homework.book.name}</h2>
            <p className="text-sm text-gray-500">
              {new Date(homework.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} ödevi
            </p>
          </div>
        </div>

        <button onClick={() => handleDeleteHomework()} className="p-2 rounded-full hover:bg-gray-200 bg-red-300">
          <TrashIcon className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-1 bg-white rounded-lg shadow p-4">
        {/* Notes kısmı: 1 kolon genişliğinde */}
        <div className="col-span-1">
          <p className="text-sm text-gray-500">{renderNotes(homework.notes || '')}</p>
        </div>
      </div>

      {homework.attachments && homework.attachments.length > 0 && (
        <div className="grid grid-cols-1 gap-1 bg-white rounded-lg shadow p-4">
          <div className="col-span-2">
            <h5 className="font-semibold text-sm text-gray-600 mb-2">Öğretmenin Eklediği Dosyalar:</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
              {homework.attachments.map((att: any) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {att.fileType.startsWith('image/') ? (
                    <img
                      src={att.fileUrl}
                      alt={att.fileName}
                      className="h-28 w-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="h-20 w-full flex items-center justify-center bg-gray-100 rounded-t-lg">
                      <DocumentIcon className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <p className="text-xs text-center p-2 truncate">{att.fileName}</p>
                </a>
              ))}
            </div>
          </div>
        
        </div>
      )}

      {/* Widget'lar */}
      <div className="grid grid-cols-3 gap-3">
        <StatWidget title="Yapanlar" count={counts.completed} icon={CheckCircleIcon} color="text-green-500" isActive={filter === 'completed'} onClick={() => setFilter('completed')} />
        <StatWidget title="Yapmayanlar" count={counts.not_completed} icon={XCircleIcon} color="text-red-500" isActive={filter === 'not_completed'} onClick={() => setFilter('not_completed')} />
        <StatWidget title="Bitirmeyenler" count={counts.pending} icon={ClockIcon} color="text-yellow-500" isActive={filter === 'pending'} onClick={() => setFilter('pending')} />
      </div>

      {/* Öğrenci Listesi */}
      <div className="bg-white rounded-lg shadow">
        <ul className="divide-y divide-gray-200">
          {filteredStudents.map((student: any) => {
            
            return (
              <li key={student.id} className="flex items-center justify-between p-4">
                <Link 
                href={student.submissionId ? `/teacher/submission/${student.submissionId}?parentId=${student.parentUserId}` : '#'} 
                className={`font-medium text-gray-800 dark:text-gray-700 ${student.submissionId ? 'hover:underline' : 'cursor-default opacity-60'}`}
                onClick={(e) => !student.submissionId && e.preventDefault()}
              >
                {student.name}
              </Link>
              <div className="flex items-center gap-3">
                <StatusBadge status={student.finalStatus} />
                {/* DEĞİŞİKLİK: Mesaj ikonu artık kendi başına ayrı bir Link */}
                <Link 
                  href={`/teacher/messages/${student.parentUserId}?studentId=${student.id}`} 
                  className="p-1 rounded-full text-gray-400 hover:text-blue-500 hover:bg-gray-100"
                >
                    <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6"/>
                </Link>
              </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}