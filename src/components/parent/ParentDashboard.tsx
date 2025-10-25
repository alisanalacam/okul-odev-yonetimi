"use client";

import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { CalendarDaysIcon, ChevronRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/solid';
import { useRouter, useSearchParams } from 'next/navigation';

// Tekrar kullanılabilir durum rozeti
const StatusBadge = ({ status }: { status: string }) => {
  const styles: { [key: string]: string } = {
    completed: 'bg-green-100 text-green-800 ring-green-600/20',
    not_completed: 'bg-red-100 text-red-800 ring-red-600/20',
    pending: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  };
  const text: { [key: string]: string } = {
    completed: 'Yaptı',
    not_completed: 'Yapmadı',
    pending: 'Bekliyor',
  };
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${styles[status]}`}>{text[status]}</span>;
};

export default function ParentDashboard() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  //const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const dateFromUrl = searchParams.get('date');
  const initialDate = dateFromUrl || new Date().toISOString().split('T')[0];

  // State'i URL'den gelen veya bugünün tarihiyle başlat
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    // Sadece URL'deki tarih mevcut state'ten farklıysa güncelle
    if (targetDate !== selectedDate) {
        console.log(`URL changed. Updating state: ${targetDate}`);
        setSelectedDate(targetDate);
    }
    // Eğer URL'de tarih yoksa, URL'yi bugüne ayarla (ilk yükleme için)
    // Ama bunu sadece selectedDate state'i henüz ayarlanmadıysa yapalım
    else if (!dateParam && selectedDate !== targetDate) {
        console.log(`Initial load without date param. Setting URL and state to today: ${targetDate}`);
        // Hem state'i hem URL'yi ayarla
        setSelectedDate(targetDate);
        router.replace(`/parent?date=${targetDate}`, { scroll: false });
    }
  }, [searchParams, router, selectedDate]); // selectedDate bağımlılığını geri ekleyelim ama kontrolü içeride yapalım

  useEffect(() => {

    if (!token || !selectedDate) {
      console.log("Skipping fetch: No token or selectedDate.");
      setHomeworks([]);
      return;
    }

    const studentId = localStorage.getItem('selectedStudent');
    if (!studentId) {
        console.log("Skipping fetch: No Student selected.");
        setHomeworks([]);
        return;
    }

    console.log(`Fetching homeworks for date: ${selectedDate}`);
    setLoading(true);
    api.get(`/api/parent/homeworks?studentId=${studentId}&date=${selectedDate}`, token)
      .then(fetchedHomeworks => {
        console.log("Homeworks fetched:", fetchedHomeworks);
        setHomeworks(fetchedHomeworks);
      })
      .catch(err => {
        console.error("Ödevler yüklenemedi:", err);
        setHomeworks([]);
      })
      .finally(() => {
        console.log("Fetch finished.");
        setLoading(false);
      });

  // Bu effect SADECE token veya selectedDate değiştiğinde çalışmalı.
  }, [token, selectedDate]);
  
  const formatDateHeader = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Bugünün Ödevleri";
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleDateChange = (newDate: string) => {
    router.replace(`/parent?date=${newDate}`, { scroll: false });
  };

  if (selectedDate === null) {
    return <div className="text-center py-10 dark:text-gray-900">Tarih ayarlanıyor...</div>;
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

        <div className="absolute inset-y-0 left-0 mt-[22px] pl-3 flex items-center pointer-events-none dark:text-gray-700 dark:bg-white">
          <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
        </div>

        <input
          id="homeworkDate"
          type="date"
          value={selectedDate || ''}
          onChange={(e) => handleDateChange(e.target.value)}
          className="block w-full appearance-none bg-white border border-gray-300 rounded-lg shadow-sm py-3 pl-10 pr-3 text-base text-gray-900 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      {/* Ödev Listesi */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-3">{formatDateHeader(selectedDate || '')}</h2>
        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-gray-500 py-4">Ödevler yükleniyor...</p>
          ) : homeworks.length > 0 ? (
            homeworks.map(hw => (
              // Ödev Kartı - Tıklandığında teslim sayfasına gidecek
              <Link key={hw.id} href={`/parent/homework/${hw.id}`} className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
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
                  <div className="flex items-center gap-3">
                    <StatusBadge status={hw.status} />
                    <ChevronRightIcon className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            // Boş Durum
            <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400"/>
              <p className="mt-2 font-semibold dark:text-gray-700">Ödev Bulunmuyor</p>
              <p className="text-sm dark:text-gray-400">Bu tarih için atanmış bir ödev yok.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}