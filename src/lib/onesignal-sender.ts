interface NotificationPayload {
    playerIds: string[];
    title: string;
    message: string;
    url?: string; // Tıklanınca açılacak sayfa
  }
  
  export async function sendNotification({ playerIds, title, message, url }: NotificationPayload) {
    console.log('sendNotification')
    if (playerIds.length === 0) return;
  
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY!}`
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        include_player_ids: playerIds,
        headings: { en: title },
        contents: { en: message },
        url: url,
        web_buttons: [{ id: "read-more-button", text: "Görüntüle", icon: "" }]
      })
    });
  
    if (!response.ok) {
      console.error("OneSignal notification failed:", await response.json());
    }
    console.log('sendNotification success')
  }