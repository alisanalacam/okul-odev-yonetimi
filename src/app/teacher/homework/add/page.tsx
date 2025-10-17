"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { compressImage } from '@/lib/image-compressor';
import { PlusIcon, TrashIcon, ArrowLeftIcon, CheckIcon, CameraIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/solid';

// State'in doğru tipini tanımlayalım
interface HomeworkItem {
  id: number;
  bookId: string;
  notes: string;
  files: File[];
  previews: { url: string; type: string; name: string }[];
}

export default function AddHomeworkPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [books, setBooks] = useState<any[]>([]);
    const [homeworkItems, setHomeworkItems] = useState<HomeworkItem[]>([{ id: Date.now(), bookId: '', notes: '', files: [], previews: [] }]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const classId = localStorage.getItem('selectedClassId');
        if (token && classId) {
            api.get(`/api/teacher/books?classId=${classId}`, token).then(setBooks);
        }
    }, [token]);

    const handleItemChange = (id: number, field: 'bookId' | 'notes', value: string) => {
        setHomeworkItems(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleFileChange = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            
            const processingPromises = filesArray.map(async (file) => {
                const processedFile = file.type.startsWith('image/') ? await compressImage(file) : file;
                return {
                    file: processedFile,
                    preview: {
                        url: URL.createObjectURL(processedFile),
                        type: processedFile.type,
                        name: processedFile.name,
                    }
                };
            });

            try {
                const processedFiles = await Promise.all(processingPromises);

                setHomeworkItems(items => 
                    items.map(item => 
                        item.id === id ? { 
                            ...item, 
                            files: [...item.files, ...processedFiles.map(p => p.file)],
                            previews: [...item.previews, ...processedFiles.map(p => p.preview)] 
                        } : item
                    )
                );
            } catch (error) {
                console.error("Dosyalar işlenirken hata:", error);
            }
            e.target.value = '';
        }
    };

    // YENİ VE DÜZELTİLMİŞ KOD
    const removePhoto = (itemId: number, previewIndex: number) => {
        setHomeworkItems(items => items.map(item => {
            if (item.id === itemId) {
                // İlgili preview'a ait URL'i bul ve bellekten temizle
                const previewToRemove = item.previews[previewIndex];
                if (previewToRemove) {
                    URL.revokeObjectURL(previewToRemove.url);
                }
                // Hem files dizisinden hem de previews dizisinden ilgili indeksi kaldır
                return {
                    ...item,
                    files: item.files.filter((_, i) => i !== previewIndex),
                    previews: item.previews.filter((_, i) => i !== previewIndex),
                };
            }
            return item;
        }));
    };
    
    // YENİ VE DÜZELTİLMİŞ KOD
    const addItem = () => {
        setHomeworkItems(items => [...items, { 
            id: Date.now(), 
            bookId: '', 
            notes: '', 
            files: [], // Boş dizi olarak başlatmak "iterable" hatasını çözer
            previews: [] // Boş dizi olarak başlatmak "iterable" hatasını çözer
        }]);
    };
    
    const removeItem = (id: number) => {
        // Silmeden önce preview URL'lerini bellekten temizle
        const itemToRemove = homeworkItems.find(item => item.id === id);
        itemToRemove?.previews.forEach(p => URL.revokeObjectURL(p.url));
        setHomeworkItems(items => items.filter(item => item.id !== id));
    };
    
    const handleSubmit = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        const classId = localStorage.getItem('selectedClassId');
        
        formData.append('classId', classId!);
        formData.append('date', date);

        const homeworksToSubmit = homeworkItems
            .filter(item => item.bookId)
            .map(({ files, previews, ...rest }) => rest);
        
        formData.append('homeworks', JSON.stringify(homeworksToSubmit));

        homeworkItems.forEach(item => {
            if (item.bookId) { // Sadece geçerli ödevlerin dosyalarını ekle
                item.files.forEach(file => {
                    formData.append(`files_${item.id}`, file);
                });
            }
        });

        try {
            await fetch('/api/teacher/homeworks', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token!}` },
                body: formData,
            });
            router.push('/teacher');
        } catch (error) {
            alert('Ödevler eklenemedi.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200"><ArrowLeftIcon className="h-6 w-6 text-gray-700"/></button>
                <h2 className="text-2xl font-bold text-gray-800">Yeni Ödev Ekle</h2>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">Ödev Tarihi</label>
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="input w-full mt-1"/>
            </div>
            
            {homeworkItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow space-y-4 relative">
                    {homeworkItems.length > 1 && (
                        <button onClick={() => removeItem(item.id)} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="h-5 w-5"/></button>
                    )}
                    <div>
                        <label htmlFor={`bookId-${item.id}`} className="block text-sm font-medium text-gray-700">Kitap</label>
                        <select id={`bookId-${item.id}`} value={item.bookId} onChange={e => handleItemChange(item.id, 'bookId', e.target.value)} className="input w-full mt-1">
                            <option value="" disabled>Kitap Seçin...</option>
                            {books.map(book => <option key={book.id} value={book.id}>{book.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor={`notes-${item.id}`} className="block text-sm font-medium text-gray-700">Açıklama / Sayfa Aralığı</label>
                        <textarea id={`notes-${item.id}`} value={item.notes} onChange={e => handleItemChange(item.id, 'notes', e.target.value)} placeholder="Örn: 15-20. sayfalar arası" rows={2} className="input w-full mt-1"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Dosya Ekle <span className="text-gray-400">(Resim, PDF vb.)</span></label>
                        <label htmlFor={`photo-upload-${item.id}`} className="mt-1 flex justify-center items-center gap-2 w-full px-6 py-3 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-indigo-500">
                           <CameraIcon className="h-6 w-6 text-gray-400"/> Seç
                        </label>
                        <input id={`photo-upload-${item.id}`} type="file" multiple accept="image/*,application/pdf" onChange={(e) => handleFileChange(item.id, e)} className="sr-only"/>
                        
                        {item.previews.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            {item.previews.map((p, i) => (
                              <div key={i} className="relative">
                                {p.type.startsWith('image/') ? (
                                    <img src={p.url} className="h-28 w-full object-cover rounded-md"/>
                                ) : (
                                    <div className="h-28 w-full rounded-md bg-gray-100 flex flex-col items-center justify-center p-2 border">
                                        <DocumentIcon className="h-8 w-8 text-gray-400"/>
                                        <p className="text-xs text-center break-all line-clamp-2 mt-1">{p.name}</p>
                                    </div>
                                )}
                                <button type="button" onClick={() => removePhoto(item.id, i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                                  <XMarkIcon className="h-4 w-4"/>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={addItem} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                    <PlusIcon className="h-5 w-5"/> Başka Ödev Ekle
                </button>
                <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-300">
                    <CheckIcon className="h-5 w-5"/> 
                    {isSubmitting ? 'Ekleniyor...' : 'Ödevleri Kaydet'}
                </button>
            </div>
        </div>
    );
}