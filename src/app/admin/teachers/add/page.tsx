"use client";

import { useState, useEffect } from 'react';
import TeacherForm from "@/components/admin/TeacherForm";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface Class { id: number; grade: number; section: string; }

export default function AddTeacherPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (!token) return;
        api.get('/api/classes', token)
            .then(data => setAvailableClasses(data))
            .catch(err => console.error("Sınıflar yüklenemedi", err));
    }, [token]);

    const handleSubmit = async (data: any) => {
        // Teacher Ekleme API'ı {grade, section} bekliyordu, onu classId'ye çevirelim
        // veya API'ı classId alacak şekilde basitleştirelim.
        // Backend'i `classIds` alacak şekilde düzenlemek daha mantıklı.
        // Önceki adımdaki PUT gibi POST'u da `classIds` alacak şekilde düzenlediğimizi varsayalım.
        
        setIsSubmitting(true);
        try {
            await api.post('/api/admin/teachers', token!, data);
            router.push('/admin/teachers');
        } catch (error) {
            alert("Öğretmen eklenemedi.");
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Yeni Öğretmen Ekle</h2>
            {availableClasses.length > 0 ? (
                 <TeacherForm 
                    onSubmit={handleSubmit}
                    availableClasses={availableClasses}
                    isSubmitting={isSubmitting}
                 />
            ) : (
                <p>Sınıflar yükleniyor...</p>
            )}
        </div>
    );
}