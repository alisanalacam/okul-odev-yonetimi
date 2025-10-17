"use client";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { BellIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotificationBell() {
    const { token, user, unreadCount, setUnreadCount } = useAuth();

    useEffect(() => {
        if (!token) return;
        // Sayfa yüklendiğinde ve periyodik olarak bildirimleri kontrol et
        const fetchNotifications = () => {
            api.get('/api/notifications', token).then(data => {
                const count = data.notifications.filter((n: any) => !n.isRead).length;
                setUnreadCount(count);
            });
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Her dakika kontrol et
        return () => clearInterval(interval);
    }, [token]);

    const destination = user?.role === 'teacher' ? '/teacher/notifications' : '/parent/notifications';

    return (
        <Link href={destination} className="relative p-2 text-gray-500 hover:text-blue-500">
            <BellIcon className="h-6 w-6" />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    );
}