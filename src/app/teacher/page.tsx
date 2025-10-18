"use client";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { PlusIcon, CalendarDaysIcon, ChevronRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/solid';

// Ana panel içeriği ayrı bir component'te olacak
function TeacherDashboard() {
  const { token } = useAuth();
  //const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tarihe göre başlığı formatlayan yardımcı fonksiyon
  const formatDateHeader = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Bugünün Ödevleri";
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    // Component yüklendiğinde bugünün tarihini ayarla
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []); // Boş dependency array, sadece bir kere çalışmasını sağlar
  
  useEffect(() => {
    const classId = localStorage.getItem('selectedClassId');
    if (!token || !classId || !selectedDate) return;

    setLoading(true);
    api.get(`/api/teacher/homeworks?classId=${classId}&date=${selectedDate}`, token)
      .then(setHomeworks)
      .catch(err => console.error("Ödevler yüklenemedi:", err))
      .finally(() => setLoading(false));

  }, [token, selectedDate]);

  if (!selectedDate) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Tarih Seçim Alanı */}
      <div className="relative w-full">
        <label
          htmlFor="homeworkDate"
          className="block text-sm font-medium text-gray-500 mb-1"
        >
          Tarih Seç
        </label>

        <div className="absolute inset-y-0 left-0 mt-[22px] pl-3 flex items-center pointer-events-none">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
        </div>

        <input
          id="homeworkDate"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="block w-full appearance-none border border-gray-300 rounded-lg shadow-sm py-3 pl-10 pr-3 text-base text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      
      {/* Ödev Ekle Butonu */}
      <Link href="/teacher/homework/add" className="flex items-center justify-center w-full gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-colors">
        <PlusIcon className="h-6 w-6" />
        Yeni Ödev Ekle
      </Link>
      
      {/* Ödev Listesi */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">{formatDateHeader(selectedDate)}</h2>
        <div className="space-y-3">
          {loading ? (
             <p className="text-center text-gray-500 py-4">Ödevler yükleniyor...</p>
          ) : homeworks.length > 0 ? (
            homeworks.map(hw => (
              // Ödev Kartı
              <Link key={hw.id} href={`/teacher/homework/${hw.id}`} className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={hw.book.coverImageUrl || '/placeholder-book.svg'} 
                      alt={hw.book.name} 
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{hw.book.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{hw.notes || 'Açıklama yok'}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-6 w-6 text-gray-400" />
                </div>
              </Link>
            ))
          ) : (
            // Boş Durum
            <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400"/>
              <p className="mt-2 font-semibold">Ödev Bulunmuyor</p>
              <p className="text-sm">Bu tarih için eklenmiş bir ödev yok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherRootPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) return;

    api.get('/api/teacher/profile', token).then(profile => {
      if (profile.classes.length === 0) {
        setStatus('no-class');
      } else if (profile.classes.length === 1) {
        localStorage.setItem('selectedClassId', profile.classes[0].id.toString());
        setStatus('ready');
      } else {
        const selectedClassId = localStorage.getItem('selectedClassId');
        if (selectedClassId) {
          setStatus('ready');
        } else {
          router.push('/teacher/select-class');
        }
      }
    });
  }, [token, router]);

  if (status === 'loading') return <div>Yükleniyor...</div>;
  if (status === 'no-class') return <div>Size atanmış bir sınıf bulunmuyor.</div>;
  
  return <TeacherDashboard />;
}