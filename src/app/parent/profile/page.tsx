"use client";

import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { UserCircleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';

export default function ParentProfilePage() {
    const { token, logout } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.get('/api/parent/profile', token)
               .then(setProfile)
               .catch(err => console.error("Profil bilgileri yüklenemedi:", err))
               .finally(() => setLoading(false));
        }
    }, [token]);

    if (loading) return <div className="text-center py-10">Profil bilgileri yükleniyor...</div>;
    if (!profile) return <div className="text-center py-10">Profil bilgileri bulunamadı.</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Profilim</h2>
            
            {/* Veli Bilgileri Kartı */}
            <div className="bg-white p-4 rounded-lg shadow space-y-3">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">Ad Soyad</span>
                    <span className="font-semibold text-gray-900">{profile.name}</span>
                </div>
                 <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                    <span className="text-gray-600">E-posta</span>
                    <span className="font-semibold text-gray-900">{profile.email}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-600">Telefon</span>
                    <span className="font-semibold text-gray-900">{profile.phone}</span>
                </div>
            </div>

            {/* Öğrencilerim Bölümü */}
            <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Öğrencilerim</h3>
                <div className="space-y-3">
                    {profile.students.map((student: any) => (
                        <div key={student.id} className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
                            <UserCircleIcon className="h-10 w-10 text-indigo-400 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">{student.class.grade}-{student.class.section} Sınıfı</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Çıkış Yap Butonu */}
            <div className="pt-6">
                 <button 
                    onClick={logout} 
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-red-600 transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                    Çıkış Yap
                </button>
            </div>
        </div>
    );
}