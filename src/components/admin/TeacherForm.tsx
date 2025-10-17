"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Class { id: number; grade: number; section: string; }
interface TeacherFormData {
  name: string;
  email: string;
  phone: string;
  branch: string;
  classIds: number[];
}
interface TeacherFormProps {
  initialData?: any;
  availableClasses: Class[];
  onSubmit: (data: TeacherFormData) => Promise<void>;
  isSubmitting: boolean;
}

export default function TeacherForm({ initialData, availableClasses, onSubmit, isSubmitting }: TeacherFormProps) {
  const [formData, setFormData] = useState<TeacherFormData>({
    name: '',
    email: '',
    phone: '',
    branch: '',
    classIds: [],
  });
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        branch: initialData.teacherDetails?.branch || '',
        classIds: initialData.teacherClasses?.map((tc: any) => tc.classId) || [],
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData(prev => ({ ...prev, classIds: selectedIds }));
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Ad Soyad</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-posta</label>
        <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>
       <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefon</label>
        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>
       <div>
        <label htmlFor="branch" className="block text-sm font-medium text-gray-700">Branş</label>
        <input type="text" name="branch" id="branch" value={formData.branch} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>
      <div>
         <label htmlFor="classIds" className="block text-sm font-medium text-gray-700">Sorumlu Olduğu Sınıflar (Çoklu seçim için CTRL/CMD basılı tutun)</label>
         <select
            id="classIds"
            multiple
            value={formData.classIds.map(String)} // value string dizisi bekler
            onChange={handleClassChange}
            className="mt-1 block w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
         >
            {availableClasses.map(c => (
                <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>
            ))}
         </select>
      </div>
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">İptal</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}