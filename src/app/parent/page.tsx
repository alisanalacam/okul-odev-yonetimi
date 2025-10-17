"use client";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ParentDashboard from "@/components/parent/ParentDashboard";

export default function ParentRootPage() {
  const { token, user, selectedStudent, selectStudent, isLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // AuthProvider'ın yükleme işlemini bitirmesini bekle.
    if (isLoading) {
      return; 
    }
    
    // Yükleme bitti, artık context'teki bilgilere güvenebiliriz.
    if (!user) {
      // Bu normalde ParentLayout tarafından yakalanır, ama ek bir güvenlik katmanı.
      router.replace('/login');
      return;
    }

    // Context'te seçili öğrenci varsa, her şey yolunda demektir.
    if (selectedStudent) {
      setStatus('ready');
      return;
    }
    
    // Context'te öğrenci yoksa (ilk giriş veya seçim sıfırlama durumu),
    // API'dan profili çekip karar ver.
    api.get('/api/parent/profile', token!).then(profile => {
      if (!profile.students || profile.students.length === 0) {
        setStatus('no-student');
      } else if (profile.students.length === 1) {
        const student = profile.students[0];
        const studentInfo = { id: student.id, name: student.name, class: `${student.class.grade}-${student.class.section}` };
        selectStudent(studentInfo); // State'i ve localStorage'ı güncelle
        setStatus('ready');
      } else {
        router.push('/parent/select-student');
      }
    });

  }, [token, user, selectedStudent, isLoading, router, selectStudent]);

  if (status === 'loading' || isLoading) return <div>Yükleniyor...</div>;
  if (status === 'no-student') return <div>Sisteme kayıtlı öğrenciniz bulunmamaktadır.</div>;
  
  return status === 'ready' ? <ParentDashboard /> : <div>Yönlendiriliyor...</div>;
}