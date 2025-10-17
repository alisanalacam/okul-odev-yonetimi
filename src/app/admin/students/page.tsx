"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import api from "@/lib/api";

interface Class { id: number; grade: number; section: string; }
interface Student {
  id: number;
  name: string;
  class: Class;
  parent: { name: string; email: string };
}

export default function StudentsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const classesData = await api.get('/api/classes', token);
        setClasses(classesData);

        const url = selectedClass ? `/api/admin/students?classId=${selectedClass}` : '/api/admin/students';
        const studentsData = await api.get(url, token);
        setStudents(studentsData);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, selectedClass]);

  const handleDelete = async (id: number) => {
    if (confirm('Bu öğrenciyi silmek istediğinizden emin misiniz?')) {
        try {
            await api.delete(`/api/admin/students/${id}`, token!);
            setStudents(students.filter(s => s.id !== id));
        } catch (error) {
            alert('Silme işlemi başarısız oldu.');
        }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Öğrenciler</h2>
        <Link href="/admin/students/add" className="bg-green-500 text-white p-2 rounded-full shadow-md hover:bg-green-600">
          <PlusIcon className="h-6 w-6" />
        </Link>
      </div>

      <div className="mb-4">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Tüm Sınıflar</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.grade}-{c.section}</option>
          ))}
        </select>
      </div>
      
      {loading ? ( <p>Yükleniyor...</p> ) : (
        <div className="space-y-3">
          {students.map(student => (
            <div key={student.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
              <div>
                <p className="font-bold">{student.name}</p>
                <p className="text-sm text-gray-600">Sınıf: {student.class.grade}-{student.class.section}</p>
                <p className="text-xs text-gray-500">Veli: {student.parent.name} ({student.parent.email})</p>
              </div>
              <div className="flex items-center space-x-2">
                 <Link href={`/admin/students/edit/${student.id}`} className="p-2 text-gray-500 hover:text-blue-600">
                    <PencilIcon className="h-5 w-5" />
                 </Link>
                 <button onClick={() => handleDelete(student.id)} className="p-2 text-gray-500 hover:text-red-600">
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