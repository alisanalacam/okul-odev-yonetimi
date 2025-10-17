"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
// YENİ: Daha fazla ikon import ediyoruz
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, CameraIcon, PaperClipIcon, XMarkIcon } from '@heroicons/react/24/solid';
import CommentsSection from '@/components/shared/CommentsSection';

export default function ParentSubmissionPage() {
    const { token, user, selectedStudent } = useAuth();
    const router = useRouter();
    const params = useParams();
    const homeworkId = params.homeworkId;

    const [data, setData] = useState<any>(null);
    const [status, setStatus] = useState<'completed' | 'not_completed' | null>(null);
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Veri çekme ve state'i doldurma
    useEffect(() => {
        if (token && selectedStudent?.id && homeworkId) {
            api.get(`/api/parent/submissions/${homeworkId}?studentId=${selectedStudent.id}`, token)
               .then(res => {
                    setData(res);
                    if (res.submission) {
                        setStatus(res.submission.status);
                        setNotes(res.submission.parentNotes || '');
                    }
                });
        }
    }, [token, selectedStudent, homeworkId]);
    
    // Bellek sızıntısını önlemek için URL'leri temizle
    useEffect(() => {
        return () => previews.forEach(url => URL.revokeObjectURL(url));
    }, [previews]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setPhotos(p => [...p, ...filesArray]);
            const previewsArray = filesArray.map(file => URL.createObjectURL(file));
            setPreviews(p => [...p, ...previewsArray]);
            e.target.value = ''; // Input'u sıfırla ki aynı dosya tekrar seçilebilsin
        }
    };

    const handleRemovePhoto = (indexToRemove: number) => {
        setPhotos(photos.filter((_, index) => index !== indexToRemove));
        setPreviews(previews.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async () => {
        if (!status) {
            alert("Lütfen ödevin durumunu (Yaptı / Yapmadı) seçin.");
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('studentId', selectedStudent!.id.toString());
        formData.append('homeworkId', homeworkId as string);
        formData.append('status', status);
        formData.append('parentNotes', notes);
        photos.forEach(photo => formData.append('photos', photo));
        
        try {
            await fetch('/api/parent/submissions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token!}` },
                body: formData,
            });
            router.push('/parent');
        } catch (error) {
            alert("Ödev gönderilirken bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!data) return <div className="text-center py-10">Yükleniyor...</div>;

    return (
        <div className="space-y-6">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-black font-medium">
                <ArrowLeftIcon className="h-5 w-5"/> Geri
            </button>
            
            {/* Ödev Bilgi Kartı */}
            <div className="bg-white p-4 rounded-lg shadow flex items-start gap-4">
                <img 
                  src={data.homework.book.coverImageUrl || 'https://via.placeholder.com/80x112?text=Kitap'} 
                  alt={data.homework.book.name} 
                  className="w-20 h-28 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-grow">
                  <h2 className="font-bold text-xl text-gray-900">{data.homework.book.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Öğretmen: {data.homework.teacher.name}</p>
                  <p className="text-gray-700 mt-2 bg-gray-100 p-2 rounded-md">{data.homework.notes || 'Öğretmen notu yok'}</p>
                </div>
            </div>

            {/* Teslim Formu Kartı */}
            <div className="bg-white p-4 rounded-lg shadow space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Ödev Durumunu Belirle*</h3>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                      <button onClick={() => setStatus('completed')} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${status === 'completed' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}>
                        <CheckCircleIcon className="h-6 w-6"/> <span className="font-semibold">Yaptı</span>
                      </button>
                      <button onClick={() => setStatus('not_completed')} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${status === 'not_completed' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-red-50'}`}>
                        <XCircleIcon className="h-6 w-6"/> <span className="font-semibold">Yapmadı</span>
                      </button>
                  </div>
                </div>
                
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Not Ekle <span className="text-gray-400">(İsteğe Bağlı)</span></label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Öğretmeninize iletmek istediğiniz bir not var mı?" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Fotoğraf Ekle <span className="text-gray-400">(İsteğe Bağlı)</span></label>
                    <label htmlFor="photo-upload" className="mt-2 flex justify-center items-center gap-2 w-full px-6 py-4 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
                        <CameraIcon className="h-6 w-6 text-gray-400"/>
                        <span className="text-indigo-600 font-semibold">Fotoğraf Seç</span>
                    </label>
                    <input id="photo-upload" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only"/>
                    
                    {previews.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {previews.map((src, i) => (
                            <div key={i} className="relative">
                                <img src={src} className="h-28 w-full object-cover rounded-md"/>
                                <button onClick={() => handleRemovePhoto(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                                    <XMarkIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        ))}
                      </div>
                    )}
                </div>

                <button onClick={handleSubmit} disabled={isSubmitting || !status} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Kaydediliyor...' : 'Ödevi Gönder'}
                </button>
            </div>

            {/* Yorumlar Bölümü */}
            {data.submission && (
                <CommentsSection 
                  submissionId={data.submission.id}
                  comments={data.submission.comments}
                  recipientId={data.homework.teacherUserId} // Bildirim gidecek kişi: Öğretmen
                  getLatestData={() => api.get(`/api/parent/submissions/${homeworkId}?studentId=${selectedStudent!.id}`, token!).then(setData)}
                  apiEndpoint="/api/parent/comments" // Veli'nin yorum göndereceği API
                />
              )}
        </div>
    );
}

// Yorumlar bölümü için ortak bileşeni (CommentsSection) oluşturmayı unutmayın.
// Bu bileşen, /components/shared/ altına konulabilir ve hem öğretmen hem veli tarafından kullanılabilir.