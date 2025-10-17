// src/components/admin/StudentForm.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Class { id: number; grade: number; section: string; }
interface StudentFormData {
  studentName: string;
  classId: number | '';
  parentName: string;
  parentEmail: string;
  parentPhone: string;
}
interface StudentFormProps {
  initialData?: any;
  availableClasses: Class[];
  onSubmit: (data: StudentFormData) => Promise<void>;
  isSubmitting: boolean;
}

export default function StudentForm({ initialData, availableClasses, onSubmit, isSubmitting }: StudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    studentName: '', classId: '', parentName: '', parentEmail: '', parentPhone: '',
  });
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setFormData({
        studentName: initialData.name || '',
        classId: initialData.classId || '',
        parentName: initialData.parent?.name || '',
        parentEmail: initialData.parent?.email || '',
        parentPhone: initialData.parent?.phone || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Öğrenci Bilgileri</h3>
        <div>
          <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">Ad Soyad</label>
          <input type="text" name="studentName" id="studentName" value={formData.studentName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label htmlFor="classId" className="block text-sm font-medium text-gray-700">Sınıfı</label>
          <select name="classId" id="classId" value={formData.classId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <option value="" disabled>Sınıf Seçin</option>
            {availableClasses.map(c => ( <option key={c.id} value={c.id}>{c.grade}-{c.section}</option> ))}
          </select>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Veli Bilgileri</h3>
         <div>
          <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">Ad Soyad</label>
          <input type="text" name="parentName" id="parentName" value={formData.parentName} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">E-posta</label>
          <input type="email" name="parentEmail" id="parentEmail" value={formData.parentEmail} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">Telefon</label>
          <input type="tel" name="parentPhone" id="parentPhone" value={formData.parentPhone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">İptal</button>
        <button type="submit" disabled={isSubmitting} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-green-300">
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}