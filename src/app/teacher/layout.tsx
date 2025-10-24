"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation"; // usePathname ekleyin
import { useEffect, ReactNode, useState } from "react";
import Link from "next/link";
// Gerekli ikonları import edin
import { HomeIcon, ChatBubbleBottomCenterTextIcon, MegaphoneIcon, UserCircleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';
import NotificationBell from "@/components/shared/NotificationBell";
import api from "@/lib/api"; // Header'ın veri çekmesi için
//import OneSignalProvider from "@/components/shared/OneSignalProvider";

// ------------- HEADER BİLEŞENİ -------------
const TeacherHeader = () => {
  const { token, logout, user,  } = useAuth(); // Logout ve user'ı buradan alın
  const [profile, setProfile] = useState<any>(null);
  const [selectedClassInfo, setSelectedClassInfo] = useState<{ id: number; grade: number; section: string } | null>(null);
  const router = useRouter();

  // Profil verisini çek
  useEffect(() => {
    if (token) {
      api.get('/api/teacher/profile', token).then(setProfile).catch(err => console.error("Profil alınamadı:", err));
    }
  }, [token]);

  // Seçili sınıf bilgisini al ve güncelle (localStorage veya context'ten)
  useEffect(() => {
    const updateClassInfo = () => {
        const classId = localStorage.getItem('selectedClassId');
        if (classId && profile?.classes) {
            const foundClass = profile.classes.find((c: any) => c.id === parseInt(classId));
            setSelectedClassInfo(foundClass || null); // Bulamazsa null yap
        } else {
            setSelectedClassInfo(null); // Profil yoksa veya classId yoksa null yap
        }
    };
    updateClassInfo();
    // İsteğe bağlı: localStorage değişikliklerini dinlemek için event listener eklenebilir.
  }, [profile]); // Profil verisi geldiğinde veya değiştiğinde çalıştır

  const handleClassChange = () => {
    localStorage.removeItem('selectedClassId');
    setSelectedClassInfo(null); // State'i anında güncelle
    router.push('/teacher/select-class'); // Seçim sayfasına yönlendir
  }

  // Profil verisi yüklenene kadar bir yükleme göstergesi veya boşluk bırak
  if (!profile) {
      // Header yüksekliği kadar boşluk bırakarak layout kaymasını engelle
      return <header className="bg-white shadow p-4 sticky top-0 z-10  flex items-center justify-end"><NotificationBell /></header>;
  }

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10 "> {/* Sabit yükseklik */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-lg truncate dark:text-gray-900">{profile.name}</p>
        <p className="text-sm text-gray-600">{profile.branch || 'Branş Yok'}</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {selectedClassInfo && (
           <div className="text-right">
               <span className="text-sm font-semibold dark:text-gray-700">Sınıf</span>
               <div className="flex items-center gap-1">
                   <span className="text-gray-800">{selectedClassInfo.grade}-{selectedClassInfo.section}</span>
                   {profile.classes.length > 1 && (
                       <button onClick={handleClassChange} className="text-blue-500 text-xs hover:underline">(değiştir)</button>
                   )}
               </div>
           </div>
        )}
        <NotificationBell  />
      </div>
    </header>
  );
};

// ------------- NAVİGASYON BİLEŞENİ -------------
const TeacherNav = () => {
  const pathname = usePathname();
  const navItems = [
    { href: "/teacher", label: "Ana Sayfa", Icon: HomeIcon },
    { href: "/teacher/messages", label: "Mesajlar", Icon: ChatBubbleBottomCenterTextIcon },
    { href: "/teacher/announcements", label: "Duyurular", Icon: MegaphoneIcon },
    { href: "/teacher/profile", label: "Profil", Icon: UserCircleIcon },
  ];

  return (
      <nav className="bg-white sticky bottom-0 z-10">
          <div className="flex justify-around items-center p-2 border-t-2 border-gray-200 border-t-gray-200">
              {navItems.map(({ href, label, Icon }) => {
                  const isActive = pathname === href || (href !== '/teacher' && pathname.startsWith(href));
                  return (
                      <Link key={href} href={href} className={`flex flex-col items-center justify-center p-1 w-22 ${isActive ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-500'}`}>
                          <Icon className="h-6 w-6" />
                          <span className="text-xs mt-0.5">{label}</span>
                      </Link>
                  );
              })}
          </div>
      </nav>
  );
};


// ------------- ANA LAYOUT BİLEŞENİ -------------
export default function TeacherLayout({ children }: { children: ReactNode }) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  // Yönlendirme mantığı - Sadece yükleme bittikten sonra çalışır
  useEffect(() => {
    if (!isLoading) {
      if (!token || user?.role !== 'teacher') {
        router.replace('/login');
      }
    }
  }, [isLoading, token, user, router]); // Bağımlılıklar doğru

  // EN ÖNEMLİ KISIM: AuthProvider yüklenene kadar hiçbir şey render etme.
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50">Oturum kontrol ediliyor...</div>;
  }
  
  // Yükleme bitti ama kullanıcı geçerli değilse (henüz yönlendirme olmadıysa), boş render et
  if (!token || user?.role !== 'teacher') {
      return null; // Veya minimal bir yükleme göstergesi
  }

  // Yükleme bitti ve kullanıcı geçerliyse, layout'u render et
  return (
    <div className="flex flex-col h-screen">
      {/*<OneSignalProvider />*/}
      <TeacherHeader />
      {/* İçeriğe, header ve nav bar yükseklikleri kadar padding ver */}
      <main className="flex-grow overflow-y-auto bg-gray-50 p-4"> {/* pt ve pb değerlerini ayarlayın */}
        {children}
      </main>
      <TeacherNav />
    </div>
  );
}