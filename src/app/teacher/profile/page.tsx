"use client";

import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';
import Link from "next/link";

export default function TeacherProfilePage() {
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        if(token) api.get('/api/teacher/profile', token).then(setProfile);
    }, [token]);

    if (!profile) return <div className="text-center py-10 dark:text-gray-900">Profil bilgileri yükleniyor...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Profil Bilgileri</h2>
            
            <div className="bg-white p-4 rounded-lg shadow space-y-3">
                <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Ad Soyad</span>
                    <span className="font-semibold dark:text-gray-700">{profile.name}</span>
                </div>
                 <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">E-posta</span>
                    <span className="font-semibold dark:text-gray-700">{profile.email}</span>
                </div>
                 <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Telefon</span>
                    <span className="font-semibold dark:text-gray-700">{profile.phone}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-gray-600">Branş</span>
                    <span className="font-semibold dark:text-gray-700">{profile.branch}</span>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Öğrenci Listesine Göz At</h3>
                <Link href={`/teacher/students`} className="bg-blue-500 text-white px-4 py-3 rounded-full text-sm font-medium">
                    Öğrenci Listesine Git
                </Link>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Sorumlu Olduğum Sınıflar</h3>
                <div className="flex flex-wrap gap-2">
                    {profile.classes.map((cls: any) => (
                        <span key={cls.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {cls.grade}-{cls.section}
                        </span>
                    ))}
                </div>
            </div>
            
            <div className="pt-6">
                 <button 
                    onClick={logout} 
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                    Çıkış Yap
                </button>
            </div>
        </div>
    );
}