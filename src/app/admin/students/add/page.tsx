"use client";

import { useState, useEffect } from 'react';
import StudentForm from "@/components/admin/StudentForm";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AddStudentPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [availableClasses, setAvailableClasses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (token) api.get('/api/classes', token).then(setAvailableClasses);
    }, [token]);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        // API'ımız {grade, section} bekliyor, onu oluşturalım
        const selectedClass = availableClasses.find((c: any) => c.id == data.classId);
        const submissionData = {
          studentName: data.studentName,
          studentClass: { grade: selectedClass?.grade, section: selectedClass?.section },
          parentName: data.parentName,
          parentEmail: data.parentEmail,
          parentPhone: data.parentPhone,
        }
        try {
            await api.post('/api/admin/students', token!, submissionData);
            router.push('/admin/students');
        } catch (error) {
            alert("Öğrenci eklenemedi.");
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Yeni Öğrenci Ekle</h2>
            {availableClasses.length > 0 ? (
                 <StudentForm onSubmit={handleSubmit} availableClasses={availableClasses} isSubmitting={isSubmitting} />
            ) : <p>Yükleniyor...</p>}
        </div>
    );
}