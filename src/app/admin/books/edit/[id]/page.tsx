"use client";
import { useState, useEffect } from 'react';
import BookForm from "@/components/admin/BookForm";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import api from '@/lib/api';

export default function EditBookPage() {
    const { token } = useAuth();
    const router = useRouter();
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [classes, setClasses] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token || !id) return;
        Promise.all([ api.get(`/api/admin/books/${id}`, token), api.get('/api/classes', token) ])
            .then(([bookData, classesData]) => {
                setBook(bookData);
                setClasses(classesData);
            });
    }, [token, id]);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            await fetch(`/api/admin/books/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token!}` },
                body: formData,
            });
            router.push('/admin/books');
        } catch (error) { alert("Kitap güncellenemedi."); setIsSubmitting(false); }
    };

    if (!book) return <p>Yükleniyor...</p>;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Kitabı Düzenle</h2>
            <BookForm initialData={book} onSubmit={handleSubmit} availableClasses={classes} isSubmitting={isSubmitting} />
        </div>
    );
}