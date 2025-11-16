"use client";
import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, CameraIcon, XMarkIcon, DocumentIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import CommentsSection from '@/components/shared/CommentsSection';
import { compressImage } from '@/lib/image-compressor';

// Bileşenin alacağı props'ların tiplerini tanımlayalım
interface SubmissionDetailViewProps {
  initialData: any;
  refreshData: () => void;
}

export default function SubmissionDetailView({ initialData, refreshData }: SubmissionDetailViewProps) {
    const { token, user, selectedStudent } = useAuth();
    const router = useRouter();

    // Formun durumunu tutacak state'ler
    const [status, setStatus] = useState<'completed' | 'not_completed' | null>(null);
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // API'dan gelen veriyle formu doldurma
    useEffect(() => {
      if (initialData?.submission) {
        setStatus(initialData.submission.status);
        setNotes(initialData.submission.parentNotes || '');
      }
    }, [initialData]);

    // Bileşen kaldırıldığında bellek sızıntısını önlemek için önizleme URL'lerini temizle
    useEffect(() => {
        return () => previews.forEach(url => URL.revokeObjectURL(url));
    }, [previews]);

    const renderNotes = (notes: string) => {
      // http veya https ile başlayan linkleri bulur
      const urlRegex = /(https?:\/\/[^\s]+)/g
      const parts = notes.split(urlRegex)
    
      return parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {part}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })
    }

    // Dosya seçildiğinde state'leri güncelle
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        
        // Seçilen her dosyayı küçültmek için bir promise dizisi oluştur
        const compressionPromises = filesArray.map(file => compressImage(file));
        
        try {
            // Tüm küçültme işlemlerinin bitmesini bekle
            const compressedFiles = await Promise.all(compressionPromises);

            setPhotos(p => [...p, ...compressedFiles]);
            const previewsArray = compressedFiles.map(file => URL.createObjectURL(file));
            setPreviews(p => [...p, ...previewsArray]);

        } catch (error) {
            console.error("Error compressing multiple files:", error);
            alert("Resimler işlenirken bir hata oluştu.");
        }
        
        e.target.value = '';
      } else {
        console.error("No files selected");
      }
    };

    // Seçilen bir fotoğrafı önizlemeden ve yüklenecekler listesinden kaldır
    const handleRemovePhoto = (indexToRemove: number) => {
        setPhotos(photos.filter((_, index) => index !== indexToRemove));
        setPreviews(previews.filter((_, index) => index !== indexToRemove));
    };

    // Formu API'a gönderme
    const handleSubmit = async () => {
        if (!status) {
            alert("Lütfen ödevin durumunu (Yaptı / Yapmadı) seçin.");
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('studentId', selectedStudent!.id.toString());
        formData.append('homeworkId', initialData.homework.id.toString());
        formData.append('status', status);
        formData.append('parentNotes', notes);
        photos.forEach(photo => formData.append('photos', photo));
        
        try {
            await fetch('/api/parent/submissions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token!}` },
                body: formData,
            });
            router.back(); // Başarılı olunca bir önceki sayfaya dön
        } catch (error) {
            alert("Ödev gönderilirken bir hata oluştu.");
            setIsSubmitting(false);
        }
    };

    const isLocked = useMemo(() => {
      if (!initialData?.homework?.dueDate) return false; // Veri henüz gelmediyse kilitli değil
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 14); // TODO: 7 günden 14 güne çıkarıldı.
      return new Date(initialData.homework.dueDate) < oneWeekAgo;
  }, [initialData?.homework?.dueDate]);

    if (!initialData) return <div className="text-center py-10 dark:text-gray-900">Yükleniyor...</div>;

    const { homework, submission } = initialData;

    // Ödevin süresinin geçip geçmediğini hesapla
  

    return (
        <div className="space-y-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium">
                <ArrowLeftIcon className="h-5 w-5"/> Geri
            </button>
            
            {/* Ödev Bilgi Kartı */}
            <div className="bg-white p-4 rounded-lg shadow flex items-start gap-4">
                <img 
                  src={homework.book.coverImageUrl || '/placeholder-book.svg'} 
                  alt={homework.book.name} 
                  className="w-20 h-28 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-grow">
                  <h2 className="font-bold text-xl text-gray-900">{homework.book.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Öğretmen: {homework.teacher.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-1 bg-white rounded-lg shadow p-4">
              {/* Notes kısmı: 1 kolon genişliğinde */}
              <div className="col-span-1">
                <p className="text-sm text-gray-500">{renderNotes(homework.notes || '')}</p>
              </div>
              <div className="col-span-1">

                <p>
                  {homework.isExtra ? (
                    <span className="text-sm text-gray-500 dark:text-yellow-700 bg-yellow-100 p-2 rounded-md flex items-center gap-2"><ExclamationCircleIcon className="h-5 w-5" /> Bu bir ekstra ödevdir. Puanlı değildir.</span>
                  ) : (
                    ''
                  )}
                  </p>
              </div>
            </div>

            {homework.attachments && homework.attachments.length > 0 && (
              <div className="grid grid-cols-1 gap-1 bg-white rounded-lg shadow p-4">
                <div className="col-span-1">
                  <h5 className="font-semibold text-sm text-gray-600 mb-2">Öğretmenin Eklediği Dosyalar:</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                    {homework.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {att.fileType.startsWith('image/') ? (
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="h-28 w-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="h-20 w-full flex items-center justify-center bg-gray-100 rounded-t-lg">
                            <DocumentIcon className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                        <p className="text-xs text-center p-2 truncate">{att.fileName}</p>
                      </a>
                    ))}
                  </div>
                </div>
                </div>
              )}

            {isLocked && (
                <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg text-center text-sm font-semibold">
                    Bu ödevin teslim süresi 1 haftayı geçtiği için artık işaretleme yapamazsınız.
                </div>
            )}

            {/* Teslim Formu Kartı */}
            <div className="bg-white p-4 rounded-lg shadow space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Ödev Durumunu Belirle*</h3>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                      <button onClick={() => setStatus('completed')} disabled={isLocked} className={`flex ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${status === 'completed' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}>
                        <CheckCircleIcon className="h-6 w-6"/> <span className="font-semibold">Yaptı</span>
                      </button>
                      <button onClick={() => setStatus('not_completed')} disabled={isLocked} className={`flex ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${status === 'not_completed' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'}`}>
                        <XCircleIcon className="h-6 w-6"/> <span className="font-semibold">Yapmadı</span>
                      </button>
                  </div>
                </div>
                
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Not Ekle <span className="text-gray-400">(İsteğe Bağlı)</span></label>
                    <textarea disabled={isLocked} id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Öğretmeninize iletmek istediğiniz bir not var mı?" className="mt-1 block dark:text-gray-800 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>

                {/**<div>
                    <label className="block text-sm font-medium text-gray-700">Fotoğraf Ekle <span className="text-gray-400">(İsteğe Bağlı)</span></label>
                    <label htmlFor="photo-upload" className="mt-2 flex justify-center items-center gap-2 w-full px-6 py-4 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                        <CameraIcon className="h-6 w-6 text-gray-400"/>
                        <span className="text-indigo-600 font-semibold">Fotoğraf Seç</span>
                    </label>
                    <input disabled={isLocked} id="photo-upload" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only"/>
                    
                    {previews.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {previews.map((src, i) => (
                            <div key={i} className="relative">
                                <img src={src} className="h-28 w-full object-cover rounded-md"/>
                                <button onClick={() => handleRemovePhoto(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                                    <XMarkIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        ))}
                      </div>
                    )}
                </div>*/}

                <button onClick={handleSubmit} disabled={isSubmitting || !status || isLocked} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Kaydediliyor...' : 'Ödevi Gönder'}
                </button>
            </div>

            {/* Yorumlar Bölümü */}
            {submission && (
              <CommentsSection 
                submissionId={submission.id}
                comments={submission.comments}
                recipientId={homework.teacher.id}
                // DEĞİŞİKLİK: refreshData fonksiyonunu doğrudan geçir
                getLatestData={refreshData}
                apiEndpoint="/api/parent/comments"
              />
            )}
        </div>
    );
}