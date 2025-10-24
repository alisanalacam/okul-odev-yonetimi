"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AcademicCapIcon } from '@heroicons/react/24/outline'; // Tailwind Heroicons kullanıyorsan
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isLoading, user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // AuthContext'in localStorage'dan veri okuma işlemi bitene kadar bekle
    if (isLoading) {
      return;
    }

    // Yükleme bittiğinde, eğer kullanıcı zaten giriş yapmışsa (token ve user varsa),
    // rolüne göre doğru sayfaya yönlendir.
    if (token && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'teacher') {
        router.replace('/teacher');
      } else if (user.role === 'parent') {
        router.replace('/parent');
      }
    }
  }, [isLoading, user, token, router]); // Bu değerler değiştiğinde useEffect tekrar çalışır.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Giriş yapılamadı.');
      }
      
      login(data.token, data.user);

      // Kullanıcının rolüne göre yönlendirme yap
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else if (data.user.role === 'teacher') {
        router.push('/teacher');
      } else {
        router.push('/parent');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || token) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        Oturum kontrol ediliyor, lütfen bekleyin...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500 p-4">
      <div className="max-w-sm w-full">
        {/* Logo ve başlık */}
        <div className="text-center text-white mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-full">
              <AcademicCapIcon className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">EğitimApp</h1>
          <p className="text-sm">Öğretmen ve Veli Portalı</p>
        </div>

        {/* Form Kartı */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h2 className="text-center text-lg font-bold mb-4 text-gray-800">Giriş Yap</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-2 dark:text-gray-100 dark:bg-gray-800 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="E-posta adresiniz"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefon</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-4 py-2 dark:text-gray-100 dark:bg-gray-800 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Telefon numaranız"
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition disabled:bg-blue-300"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
          {/* YENİ EKLENEN BÖLÜM */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Hesabınız yok mu?{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Veli olarak kayıt olun
              </Link>
            </p>
          </div>

          
        </div>
      </div>
    </div>
  );

}