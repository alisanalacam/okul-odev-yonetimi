"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

export default function LogoutPage() {
  const { logout, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Eğer kullanıcı zaten giriş yapmışsa (token varsa), çıkış işlemini yap.
    if (token) {
      logout();
    } else {
      // Eğer kullanıcı zaten çıkış yapmışsa ve bu sayfaya bir şekilde geldiyse,
      // doğrudan login sayfasına yönlendir.
      router.replace('/login');
    }
  }, [token, logout, router]); // Bu değerlere göre useEffect'i çalıştır

  // Yönlendirme gerçekleşene kadar kullanıcıya bir geri bildirim gösterelim.
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <ArrowPathIcon className="h-12 w-12 animate-spin text-indigo-600" />
      <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300 dark:text-gray-700">
        Çıkış yapılıyor, lütfen bekleyin...
      </p>
    </div>
  );
}