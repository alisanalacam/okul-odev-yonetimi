"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import Link from "next/link";
import { HomeIcon, ChatBubbleBottomCenterTextIcon, MegaphoneIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import NotificationBell from "@/components/shared/NotificationBell";
import { usePathname } from 'next/navigation';

const ParentHeader = ({ onStudentChange }: { onStudentChange: () => void }) => {
    const { selectedStudent, user } = useAuth(); // Artık doğrudan context'ten okuyor
    
    return (
        <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
            {selectedStudent ? (
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{selectedStudent.name}</p>
                    <p className="text-sm text-gray-500">{selectedStudent.class}</p>
                </div>
            ) : <div className="flex-1"/>}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <button onClick={onStudentChange} className="text-blue-500 text-sm font-medium whitespace-nowrap">(Değiştir)</button>
                <NotificationBell />
            </div>
        </header>
    );
};

export default function ParentLayout({ children }: { children: ReactNode }) {
  const { user, token, isLoading, selectStudent } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!token || user?.role !== 'parent')) {
      router.replace('/login');
    }
  }, [user, token, isLoading, router]);
  
  const handleStudentChange = () => {
    selectStudent(null);
    router.push('/parent/select-student'); 
  }

  // EN ÖNEMLİ DEĞİŞİKLİK: Context yüklenene kadar hiçbir şey gösterme.
  // Bu, sayfa yenilendiğinde header'ın boş görünmesini ve hatalı yönlendirmeleri engeller.
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">Yükleniyor...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <ParentHeader onStudentChange={handleStudentChange} />
      <main className="flex-grow overflow-y-auto bg-gray-50 p-4">
        {children}
      </main>
      <nav className="bg-white shadow-t border-t sticky bottom-0 z-10">
      <div className="flex justify-around items-center p-2 border-t-2 border-gray-200 border-t-gray-200">
            <Link href="/parent" className={`flex flex-col items-center justify-center p-1 w-22 ${pathname === '/parent' ? 'text-indigo-600' : 'text-gray-600'}`}><HomeIcon className="h-6 w-6" /><span className="text-xs">Ana Sayfa</span></Link>
            <Link href="/parent/messages" className={`flex flex-col items-center justify-center p-1 w-22 ${pathname.startsWith('/parent/messages') ? 'text-indigo-600' : 'text-gray-600'}`}><ChatBubbleBottomCenterTextIcon className="h-6 w-6" /><span className="text-xs">Mesajlar</span></Link>
            <Link href="/parent/announcements" className={`flex flex-col items-center justify-center p-1 w-22 ${pathname.startsWith('/parent/announcements') ? 'text-indigo-600' : 'text-gray-600'}`}><MegaphoneIcon className="h-6 w-6" /><span className="text-xs">Duyurular</span></Link>
            <Link href="/parent/profile" className={`flex flex-col items-center justify-center p-1 w-22 ${pathname.startsWith('/parent/profile') ? 'text-indigo-600' : 'text-gray-600'}`}><UserCircleIcon className="h-6 w-6" /><span className="text-xs">Profil</span></Link>
         </div>
      </nav>
    </div>
  );
}