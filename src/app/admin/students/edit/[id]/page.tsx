"use client";

import { useState, useEffect } from 'react';
import StudentForm from "@/components/admin/StudentForm";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";

export default function EditStudentPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [studentData, setStudentData] = useState(null);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || !id) return;
        Promise.all([
            api.get(`/api/admin/students/${id}`, token),
            api.get('/api/classes', token)
        ]).then(([student, classes]) => {
            setStudentData(student);
            setAvailableClasses(classes);
            setLoading(false);
        }).catch(err => {
            alert("Veriler yüklenemedi.");
            setLoading(false);
        });
    }, [token, id]);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // PUT API'miz direkt classId bekliyor, bu daha basit.
            await fetch(`/api/admin/students/${id}`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token!}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            router.push('/admin/students');
        } catch (error) {
            alert("Öğrenci güncellenemedi.");
            setIsSubmitting(false);
        }
    };
    
    if (loading) return <p>Öğrenci bilgileri yükleniyor...</p>;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Öğrenciyi Düzenle</h2>
            {studentData && (
                 <StudentForm initialData={studentData} onSubmit={handleSubmit} availableClasses={availableClasses} isSubmitting={isSubmitting} />
            )}
        </div>
    );
}