"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import api from "@/lib/api";

interface Class { id: number; grade: number; section: string; }
interface Book {
  id: number;
  name: string;
  coverImageUrl?: string;
  class: Class;
}

export default function BooksPage() {
  const { token } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesData, booksData] = await Promise.all([
            api.get('/api/classes', token),
            api.get(selectedClass ? `/api/admin/books?classId=${selectedClass}` : '/api/admin/books', token)
        ]);
        setClasses(classesData);
        setBooks(booksData);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [token, selectedClass]);

  const handleDelete = async (id: number) => {
    if (confirm('Bu kitabı silmek istediğinizden emin misiniz?')) {
      try {
        await api.delete(`/api/admin/books/${id}`, token!);
        setBooks(books.filter(b => b.id !== id));
      } catch (error) { alert('Silme işlemi başarısız oldu.'); }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Kitaplar</h2>
        <Link href="/admin/books/add" className="bg-purple-500 text-white p-2 rounded-full shadow-md hover:bg-purple-600">
          <PlusIcon className="h-6 w-6" />
        </Link>
      </div>
      <div className="mb-4">
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Tüm Sınıflar</option>
          {classes.map(c => (<option key={c.id} value={c.id}>{c.grade}-{c.section}</option>))}
        </select>
      </div>
      {loading ? (<p>Yükleniyor...</p>) : (
        <div className="space-y-3">
          {books.map(book => (
            <div key={book.id} className="bg-white p-3 rounded-lg shadow-md flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={book.coverImageUrl || '/placeholder-book.svg'} alt={book.name} className="w-16 h-20 object-cover rounded"/>
                <div>
                  <p className="font-bold">{book.name}</p>
                  <p className="text-sm text-gray-600">{book.class.grade}-{book.class.section}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                 <Link href={`/admin/books/edit/${book.id}`} className="p-2 text-gray-500 hover:text-blue-600"><PencilIcon className="h-5 w-5" /></Link>
                 <button onClick={() => handleDelete(book.id)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon className="h-5 w-5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}