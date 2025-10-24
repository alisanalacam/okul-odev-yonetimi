"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; // api'ı import et

interface User {
  id: number;
  name: string;
  role: string;
}

interface StudentInfo { id: number; name: string; class: string; }

interface AuthContextType {
  user: User | null;
  token: string | null;
  selectedStudent: StudentInfo | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  selectStudent: (student: StudentInfo | null) => void;
  isLoading: boolean;
  unreadCount: number; 
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0); // YENİ: Global bildirim sayısı
  const router = useRouter();

  useEffect(() => {
    // Sayfa yeniden yüklendiğinde localStorage'dan token'ı al
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    const storedStudent = localStorage.getItem('selectedStudent');
    const selectedStudentInfo = localStorage.getItem('selectedStudentInfo');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    if (selectedStudentInfo) {
      if (storedStudent) setSelectedStudent(JSON.parse(selectedStudentInfo));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      api.get('/api/notifications', token).then(data => {
        const count = data.notifications.filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }).catch(err => console.error("Bildirim sayısı alınamadı:", err));
    }
  }, [token]);

  const login = (newToken: string, userData: User) => {
    console.log('login oluyor');
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSelectedStudent(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('selectedClassId'); 
    localStorage.removeItem('selectedStudentInfo');
    localStorage.removeItem('selectedStudent');
    setUnreadCount(0);
    console.log('logout');
    router.push('/login'); // Kullanıcıyı login sayfasına yönlendir
  };

  const selectStudent = (student: StudentInfo | null) => {
    setSelectedStudent(student);
    if (student) {
        localStorage.setItem('selectedStudent', student.id.toString());
        localStorage.setItem('selectedStudentInfo', JSON.stringify(student));
    } else {
        localStorage.removeItem('selectedStudent');
        localStorage.removeItem('selectedStudentInfo');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, selectedStudent, login, logout, selectStudent, isLoading, unreadCount, setUnreadCount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
