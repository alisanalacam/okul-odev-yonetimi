"use client";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SelectClassPage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if(token) api.get('/api/teacher/profile', token).then(setProfile);
  }, [token]);

  const handleSelectClass = (classId: number) => {
    localStorage.setItem('selectedClassId', classId.toString());
    router.push('/teacher');
  };

  if (!profile) return <div className="text-center py-10 dark:text-gray-900">Yükleniyor...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-900">Lütfen Sınıf Seçin</h1>
      <div className="space-y-3">
        {profile.classes.map((cls: any) => (
          <button 
            key={cls.id} 
            onClick={() => handleSelectClass(cls.id)}
            className="w-full text-left p-4 bg-white rounded-lg shadow font-semibold text-lg hover:bg-blue-50 dark:text-gray-700"
          >
            {cls.grade} - {cls.section} Şubesi
          </button>
        ))}
      </div>
    </div>
  );
}