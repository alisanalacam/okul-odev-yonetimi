"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentSection, setStudentSection] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const registrationData = {
      parentName,
      parentEmail,
      parentPhone,
      studentName,
      studentClass: {
        grade: parseInt(studentGrade),
        section: studentSection
      }
    };

    try {
      const response = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kayıt işlemi başarısız oldu.');
      }
      
      setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      
      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const grades = Array.from({ length: 8 }, (_, i) => i + 1); // [1, 2, ..., 8]
  const sections = ['A', 'B', 'C', 'D']; // A, B, C, D

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Veli Kayıt Formu</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-6 rounded-lg shadow-md space-y-6">
        
        {success && <div className="p-4 bg-green-100 border-l-4 border-green-500 text-green-700"><p>{success}</p></div>}
        {error && <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700"><p>{error}</p></div>}

        {!success && (
          <>
            {/* Veli Bilgileri Bölümü */}
            <fieldset className="border p-4 rounded-md space-y-4">
              <legend className="px-2 font-semibold text-lg text-gray-700">Veli Bilgileri</legend>
              <div>
                <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                <input id="parentName" type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <div>
                <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">E-posta</label>
                <input id="parentEmail" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <div>
                <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">Telefon Numarası</label>
                <input id="parentPhone" type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
              </div>
            </fieldset>

            {/* Öğrenci Bilgileri Bölümü */}
            <fieldset className="border p-4 rounded-md space-y-4">
              <legend className="px-2 font-semibold text-lg text-gray-700">Öğrenci Bilgileri</legend>
              <div>
                <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Öğrencinin Adı Soyadı</label>
                <input id="studentName" type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="studentGrade" className="block text-sm font-medium text-gray-700">Sınıfı</label>
                    <select id="studentGrade" value={studentGrade} onChange={e => setStudentGrade(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="" disabled>Seçin...</option>
                        {grades.map(grade => <option key={grade} value={grade}>{grade}. Sınıf</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="studentSection" className="block text-sm font-medium text-gray-700">Şubesi</label>
                    <select id="studentSection" value={studentSection} onChange={e => setStudentSection(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        <option value="" disabled>Seçin...</option>
                        {sections.map(section => <option key={section} value={section}>{section} Şubesi</option>)}
                    </select>
                  </div>
              </div>
            </fieldset>

            <div>
              <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md transition disabled:bg-blue-300">
                {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
              </button>
            </div>
          </>
        )}
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Zaten bir hesabınız var mı?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}