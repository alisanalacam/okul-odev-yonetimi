"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { compressImage } from '@/lib/image-compressor';

export default function AddAnnouncementPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [type, setType] = useState('note');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [profile, setProfile] = useState<any>(null);
    const [photos, setPhotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
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
    
    const handleClassToggle = (classId: number) => {
        setSelectedClasses(prev => 
            prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
        );
    };

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
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('type', type);
        formData.append('content', content);
        formData.append('linkUrl', linkUrl);
        formData.append('classIds', JSON.stringify(selectedClasses));
        photos.forEach(photo => formData.append('photos', photo));

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
                            {t === 'note' ? 'Not' : t === 'link' ? 'Link' : 'Fotoğraf'}
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
                           <textarea id="content" value={content} onChange={e => setContent(e.target.value)} rows={3} className="input w-full mt-1mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
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
                           <label className="block text-sm font-medium text-gray-700">Fotoğraf*</label>
                           <input type="file" onChange={handleFileChange} required accept="image/*" className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                           <div className="mt-2 grid grid-cols-3 gap-2">
                                {previews.map((src, i) => <img key={i} src={src} className="h-24 w-full object-cover rounded"/>)}
                            </div>
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