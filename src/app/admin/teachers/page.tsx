"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import api from "@/lib/api";

// Tipleri tanımlayalım
interface Class { id: number; grade: number; section: string; }
interface Teacher {
  id: number;
  name: string;
  email: string;
  teacherDetails: { branch: string };
  teacherClasses: { class: Class }[];
}

export default function TeachersPage() {
  const { token } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Filtre için sınıfları ve öğretmenleri çek
        const classesData = await api.get('/api/classes', token);
        setClasses(classesData);

        const url = selectedClass ? `/api/admin/teachers?classId=${selectedClass}` : '/api/admin/teachers';
        const teachersData = await api.get(url, token);
        setTeachers(teachersData);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, selectedClass]);

  const handleDelete = async (id: number) => {
    if (confirm('Bu öğretmeni silmek istediğinizden emin misiniz?')) {
        try {
            await api.delete(`/api/admin/teachers/${id}`, token!);
            // Listeyi yeniden yükle
            setTeachers(teachers.filter(t => t.id !== id));
        } catch (error) {
            alert('Silme işlemi başarısız oldu.');
        }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Öğretmenler</h2>
        <Link href="/admin/teachers/add" className="bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-600">
          <PlusIcon className="h-6 w-6" />
        </Link>
      </div>

      {/* Filtreleme */}
      <div className="mb-4">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Tüm Sınıflar</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>
          ))}
        </select>
      </div>
      
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="space-y-3">
          {teachers.map(teacher => (
            <div key={teacher.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
              <div>
                <p className="font-bold">{teacher.name}</p>
                <p className="text-sm text-gray-600">{teacher.teacherDetails?.branch}</p>
                <p className="text-xs text-gray-500">{teacher.email}</p>
                 <div className="flex flex-wrap gap-1 mt-1">
                    {teacher.teacherClasses.map(tc => (
                        <span key={tc.class.id} className="text-xs bg-gray-200 px-2 py-1 rounded-full">{tc.class.grade}-{tc.class.section}</span>
                    ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                 <Link href={`/admin/teachers/edit/${teacher.id}`} className="p-2 text-gray-500 hover:text-blue-600">
                    <PencilIcon className="h-5 w-5" />
                 </Link>
                 <button onClick={() => handleDelete(teacher.id)} className="p-2 text-gray-500 hover:text-red-600">
                    <TrashIcon className="h-5 w-5" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}