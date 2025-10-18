"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeftIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { compressImage } from '@/lib/image-compressor';

export default function AddAnnouncementPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [type, setType] = useState('note');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [profile, setProfile] = useState<any>(null);
    const [files, setFiles] = useState<File[]>([]); // photos -> files
    const [previews, setPreviews] = useState<{ url: string; type: string; name: string }[]>([]);
    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (token) {
            api.get('/api/teacher/profile', token).then(data => {
                setProfile(data);
                // Eğer sadece 1 sınıfı varsa, otomatik seç ve state'e ata
                if (data?.classes?.length === 1) {
                    setSelectedClasses([data.classes[0].id]);
                }
            });
        }
    }, [token]);

    useEffect(() => {
        return () => previews.forEach(p => URL.revokeObjectURL(p.url));
    }, [previews]);
    
    const handleClassToggle = (classId: number) => {
        setSelectedClasses(prev => 
            prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
        );
    };

    const handleRemoveFile = (indexToRemove: number) => {
        const previewToRemove = previews[indexToRemove];
        if (previewToRemove) {
            URL.revokeObjectURL(previewToRemove.url);
        }
        setFiles(files.filter((_, index) => index !== indexToRemove));
        setPreviews(previews.filter((_, index) => index !== indexToRemove));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
    
        const filesArray = Array.from(e.target.files);
        e.target.value = ''; // Input'u hemen sıfırla
    
        try {
            const newFiles: File[] = [];
            const newPreviews: { url: string; type: string; name: string }[] = [];
    
            for (const originalFile of filesArray) {
                // 1. Dosyayı işle (resimse küçült, değilse orijinalini al)
                const processedBlob = originalFile.type.startsWith('image/')
                    ? await compressImage(originalFile)
                    : originalFile;
                
                // 2. İşlenmiş Blob'dan ve orijinal dosya adından yeni bir File objesi oluştur.
                // Bu, dosya adının ve türünün korunmasını garanti eder.
                const finalFile = new File([processedBlob], originalFile.name, {
                    type: processedBlob.type,
                    lastModified: Date.now(),
                });
    
                // 3. Önizleme URL'sini bu son, geçerli File objesinden oluştur.
                // Bu adımın çalışması garanti altındadır.
                const previewUrl = URL.createObjectURL(finalFile);
                
                newFiles.push(finalFile);
                newPreviews.push({
                    url: previewUrl,
                    type: finalFile.type,
                    name: finalFile.name,
                });
            }
            
            // 4. State'i tek seferde, yeni dosyalarla güncelle.
            setFiles(p => [...p, ...newFiles]);
            setPreviews(p => [...p, ...newPreviews]);
    
        } catch (error) {
            console.error("Dosyalar işlenirken bir hata oluştu:", error);
            alert("Dosyalar işlenirken bir hata oluştu.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (type === 'photo' && files.length === 0) {
            alert("Lütfen en az bir dosya seçin.");
            setIsSubmitting(false);
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('type', type);
        formData.append('content', content);
        formData.append('linkUrl', linkUrl);
        formData.append('classIds', JSON.stringify(selectedClasses));
        files.forEach(file => formData.append('attachments', file));

        try {
            await fetch('/api/teacher/announcements', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token!}` },
                body: formData
            });
            router.push('/teacher/announcements');
        } catch (error) {
            alert('Duyuru oluşturulamadı.');
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.back()} className="p-2 rounded-full hover:bg-gray-200"><ArrowLeftIcon className="h-6 w-6 text-gray-700"/></button>
                <h2 className="text-2xl font-bold text-gray-800">Yeni Duyuru Oluştur</h2>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
                <label className="block text-sm font-medium text-gray-700">Duyuru Türü</label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                    {['note', 'link', 'photo'].map(t => (
                        <button type="button" key={t} onClick={() => setType(t)} className={`px-4 py-2 text-sm rounded-lg border ${type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-50'}`}>
                            {t === 'note' ? 'Not' : t === 'link' ? 'Link' : 'Fotoğraf/Dosya'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Başlık*</label>
                    <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>

                {type === 'note' && (
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">Açıklama*</label>
                        <textarea id="content" value={content} onChange={e => setContent(e.target.value)} required rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                )}
                {type === 'link' && (
                    <>
                        <div>
                           <label htmlFor="content" className="block text-sm font-medium text-gray-700">Açıklama</label>
                           <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                           <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700">Link URL*</label>
                           <input id="linkUrl" type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} required placeholder="https://..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                    </>
                )}
                {type === 'photo' && (
                    <>
                        <div>
                           <label htmlFor="content" className="block text-sm font-medium text-gray-700">Açıklama</label>
                           <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700">Dosyalar* (Resim veya PDF)</label>
                        <input type="file" onChange={handleFileChange} multiple accept="image/*,application/pdf" className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                        {previews.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-3">
                            {previews.map((p, i) => (
                                <div key={i} className="relative">
                                    {p.type.startsWith('image/') ? (
                                        <img src={p.url} className="h-28 w-full object-cover rounded-md"/>
                                    ) : (
                                        <div className="h-28 w-full rounded-md bg-gray-100 flex flex-col items-center justify-center p-2 border">
                                            <DocumentIcon className="h-8 w-8 text-gray-400"/>
                                            <p className="text-xs text-center break-all line-clamp-2 mt-1">{p.name}</p>
                                        </div>
                                    )}
                                    <button type="button" onClick={() => handleRemoveFile(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md">
                                        <XMarkIcon className="h-4 w-4"/>
                                    </button>
                                </div>
                            ))}
                            </div>
                        )}
                     </div>
                    </>
                )}
            </div>
            
                {profile && profile.classes?.length > 1 && (
                <div className="bg-white p-4 rounded-lg shadow">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hangi Sınıflara Gönderilsin?*</label>
                    <div className="flex flex-wrap gap-2">
                        {profile.classes.map((cls: any) => (
                            <button type="button" key={cls.id} onClick={() => handleClassToggle(cls.id)} className={`px-3 py-1 text-sm rounded-full border ${selectedClasses.includes(cls.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-gray-50'}`}>
                                {cls.grade}-{cls.section}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <button type="submit" disabled={isSubmitting || selectedClasses.length === 0} className="flex items-center justify-center w-full gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-colors">{isSubmitting ? 'Gönderiliyor...' : 'Duyuruyu Gönder'}</button>
        </form>
    );
}