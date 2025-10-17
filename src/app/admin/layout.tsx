"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import Link from "next/link";
import { PowerIcon, ChartBarIcon, UserGroupIcon, UserPlusIcon, BookOpenIcon } from '@heroicons/react/24/solid';

// Korumalı Rota Mantığı
const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, token, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!token || user?.role !== 'admin') {
        router.replace('/login');
      }
    }
  }, [user, token, isLoading, router]);

  if (isLoading || !token || user?.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Admin Paneli</h1>
        <button onClick={logout} className="p-2 rounded-full hover:bg-gray-200">
            <PowerIcon className="h-6 w-6 text-red-500" />
        </button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        {children}
      </main>
      
      <nav className="bg-white">
        <div className="flex justify-around items-center p-2 border-t-2 border-gray-200 border-t-gray-200">
            <Link href="/admin" className="flex flex-col items-center text-gray-600 hover:text-blue-500">
                <ChartBarIcon className="h-6 w-6" />
                <span className="text-xs">Panel</span>
            </Link>
             <Link href="/admin/teachers" className="flex flex-col items-center text-gray-600 hover:text-blue-500">
                <UserGroupIcon className="h-6 w-6" />
                <span className="text-xs">Öğretmenler</span>
            </Link>
             <Link href="/admin/students" className="flex flex-col items-center text-gray-600 hover:text-blue-500">
                <UserPlusIcon className="h-6 w-6" />
                <span className="text-xs">Öğrenciler</span>
            </Link>
             <Link href="/admin/books" className="flex flex-col items-center text-gray-600 hover:text-blue-500">
                <BookOpenIcon className="h-6 w-6" />
                <span className="text-xs">Kitaplar</span>
            </Link>
         </div>
      </nav>
    </div>
  );
};

export default AdminLayout;