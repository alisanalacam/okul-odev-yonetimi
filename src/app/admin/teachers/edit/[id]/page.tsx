"use client";

import { useState, useEffect } from 'react';
import TeacherForm from "@/components/admin/TeacherForm";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";

interface Class { id: number; grade: number; section: string; }

export default function EditTeacherPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [teacherData, setTeacherData] = useState(null);
    const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || !id) return;
        
        const fetchData = async () => {
            try {
                const [teacher, classes] = await Promise.all([
                    api.get(`/api/admin/teachers/${id}`, token),
                    api.get('/api/classes', token)
                ]);
                setTeacherData(teacher);
                setAvailableClasses(classes);
            } catch (err) {
                console.error("Veriler yüklenemedi", err);
                alert("Öğretmen bilgileri yüklenemedi.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();

    }, [token, id]);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // PUT isteğini burada yapacağız.
            // await api.put(`/api/admin/teachers/${id}`, token!, data);
            // Şimdilik api.ts'e put eklemedik, fetch ile yapalım:
             await fetch(`/api/admin/teachers/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token!}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            router.push('/admin/teachers');
        } catch (error) {
            alert("Öğretmen güncellenemedi.");
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return <p>Öğretmen bilgileri yükleniyor...</p>
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Öğretmeni Düzenle</h2>
            {teacherData && (
                 <TeacherForm 
                    initialData={teacherData}
                    onSubmit={handleSubmit}
                    availableClasses={availableClasses}
                    isSubmitting={isSubmitting}
                 />
            )}
        </div>
    );
}