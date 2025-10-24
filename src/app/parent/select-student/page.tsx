"use client";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";

export default function SelectStudentPage() {
  const { token, selectStudent } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if(token) api.get('/api/parent/profile', token).then(setProfile);
  }, [token]);

  const handleSelectStudent = (student: any) => {
    const studentInfo = {
        id: student.id,
        name: student.name,
        class: `${student.class.grade}-${student.class.section}`
    };
    selectStudent(studentInfo);
    router.push('/parent');
  };

  if (!profile) return <div className="flex items-center justify-center h-screen dark:text-gray-900">Yükleniyor...</div>;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Lütfen Bir Öğrenci Seçin</h1>
      <div className="space-y-4">
        {profile.students.map((student: any) => (
          <button 
            key={student.id} 
            onClick={() => handleSelectStudent(student)}
            className="w-full flex items-center gap-4 text-left p-4 bg-white rounded-xl shadow-md font-semibold text-lg hover:bg-indigo-50 transition-colors"
          >
            <UserCircleIcon className="h-10 w-10 text-indigo-500" />
            <div>
              <p className="dark:text-gray-900">{student.name}</p>
              <p className="text-sm font-normal text-gray-500">{student.class.grade}-{student.class.section} Sınıfı</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}