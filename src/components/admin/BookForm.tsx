// src/components/admin/BookForm.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { compressImage } from '@/lib/image-compressor';

interface Class { id: number; grade: number; section: string; }
interface BookFormProps {
  initialData?: any;
  availableClasses: Class[];
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export default function BookForm({ initialData, availableClasses, onSubmit, isSubmitting }: BookFormProps) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState<number | ''>('');
  const [pageCount, setPageCount] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setClassId(initialData.classId || '');
      setPageCount(initialData.pageCount?.toString() || '');
      setImagePreview(initialData.coverImageUrl || null);
    }
  }, [initialData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const originalFile = e.target.files[0];

      try {
        const compressedFile = await compressImage(originalFile);
        setCoverImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error("Image compression failed:", error);
        setCoverImageFile(originalFile);
        setImagePreview(URL.createObjectURL(originalFile));
      }
      setIsImageRemoved(false); 
    }
  };

  const handleRemoveImage = () => {
    setCoverImageFile(null);
    setImagePreview(null);
    setIsImageRemoved(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('classId', classId.toString());
    formData.append('pageCount', pageCount);
    if (coverImageFile) {
      formData.append('coverImage', coverImageFile);
    }
    if (initialData?.coverImageUrl && !isImageRemoved) {
        formData.append('existingImageUrl', initialData.coverImageUrl);
    }
    onSubmit(formData);
  };

  const finalImagePreview = coverImageFile 
    ? imagePreview // Yeni dosya seçildiyse onun önizlemesi
    : isImageRemoved 
      ? null // Kaldırıldıysa hiçbir şey gösterme
      : imagePreview; // Başlangıçtaki resim

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Kitap Bilgileri</h3>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Kitap Adı</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="classId" className="block text-sm font-medium text-gray-700">Sınıf</label>
            <select id="classId" value={classId} onChange={e => setClassId(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="" disabled>Sınıf Seçin</option>
                {availableClasses.map(c => <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>)}
            </select>
          </div>
           <div>
            <label htmlFor="pageCount" className="block text-sm font-medium text-gray-700">Sayfa Sayısı (Opsiyonel)</label>
            <input type="number" id="pageCount" value={pageCount} onChange={e => setPageCount(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Kapak Resmi</label>
            <div className="mt-2 flex items-center gap-x-3">
                {imagePreview ? (
                    <img src={imagePreview} alt="Önizleme" className="h-24 w-20 rounded-md object-cover"/>
                ) : (
                    <PhotoIcon className="h-24 w-20 text-gray-300" aria-hidden="true" />
                )}
                <input id="file-upload" type="file" onChange={handleFileChange} accept="image/*" className="sr-only"/>
                <label htmlFor="file-upload" className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer">
                    Değiştir
                </label>
                {finalImagePreview && (
                  <button type="button" onClick={handleRemoveImage} className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-gray-100">
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                )}
            </div>
          </div>
       </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">İptal</button>
        <button type="submit" disabled={isSubmitting} className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 disabled:bg-purple-300">
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}