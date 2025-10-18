"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef } from "react";
import OneSignal from 'react-onesignal';
import api from "@/lib/api";

export default function OneSignalProvider() {
    const { user, token } = useAuth();
    // Yeniden başlatmayı önlemek için bir referans kullanıyoruz
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (user && token && !isInitializedRef.current) {
            
            const runApp = async () => {
                // Sadece bir kere çalışmasını garantile
                isInitializedRef.current = true;
                
                // 1. OneSignal'i başlat (Bu metod doğru)
                await OneSignal.init({ appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID! });
                
                // 2. Kullanıcıyı bizim sistemimizdeki ID ile OneSignal'e "login" yap (Bu metod doğru)
                const internalUserId = user.id.toString();
                OneSignal.login(internalUserId);
                
                // 3. DEĞİŞİKLİK: 'subscriptionChange' olayını doğru yerden dinle
                // Verdiğiniz interface'e göre, bu olay `OneSignal.User.PushSubscription` altından dinlenir.
                OneSignal.User.PushSubscription.addEventListener('change', (subscription) => {
                    console.log("Push subscription state changed:", subscription);
                    
                    // 'subscription' objesi, mevcut durumu içerir.
                    // 'id' alanı, bizim 'playerId' olarak adlandırdığımız koddur.
                    if (subscription.current.id) {
                        const playerId = subscription.current.id;
                        console.log("OneSignal Player ID:", playerId);
                        
                        // Bu ID'yi veritabanımıza kaydedelim
                        api.post('/api/user/save-player-id', token, { playerId });
                    }
                });
            };
            
            runApp();
        }
    }, [user, token]);

    return null; // Bu bileşen arayüzde bir şey göstermez
}