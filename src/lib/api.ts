const api = {
    get: async (url: string, token: string) => {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Veri alınamadı.');
      return response.json();
    },
    
    post: async (url: string, token: string, body: any) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Veri gönderilemedi.');
      return response.json();
    },
  
    delete: async (url: string, token: string) => {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Veri silinemedi.');
    },
    // PUT ve diğer metodlar da benzer şekilde eklenebilir
  };
  
  export default api;