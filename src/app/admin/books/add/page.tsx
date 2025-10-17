"use client";
import { useState, useEffect } from 'react';
import BookForm from "@/components/admin/BookForm";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from '@/lib/api';

export default function AddBookPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [classes, setClasses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => { if (token) api.get('/api/classes', token).then(setClasses) }, [token]);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await fetch('/api/admin/books', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token!}` },
                body: formData,
            });
            router.push('/admin/books');
        } catch (error) { alert("Kitap eklenemedi."); setIsSubmitting(false); }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Yeni Kitap Ekle</h2>
            {classes.length > 0 ? <BookForm onSubmit={handleSubmit} availableClasses={classes} isSubmitting={isSubmitting} /> : <p>Yükleniyor...</p>}
        </div>
    );
}