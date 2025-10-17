"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

interface Stats {
  teacherCount: number;
  studentCount: number;
  bookCount: number;
}

const StatCard = ({ title, value, color }: { title: string, value: number, color: string }) => (
    <div className={`p-4 rounded-lg shadow-md ${color}`}>
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
    </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('İstatistikler yüklenemedi.');
        }
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) return <div>İstatistikler yükleniyor...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
        <h2 className="text-2xl font-semibold mb-4">Genel Durum</h2>
        <div className="grid grid-cols-1 gap-4">
            <StatCard title="Toplam Öğretmen" value={stats?.teacherCount || 0} color="bg-blue-500" />
            <StatCard title="Toplam Öğrenci" value={stats?.studentCount || 0} color="bg-green-500" />
            <StatCard title="Toplam Kitap" value={stats?.bookCount || 0} color="bg-indigo-500" />
        </div>
    </div>
  );
}