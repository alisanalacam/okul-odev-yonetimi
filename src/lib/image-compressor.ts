import imageCompression from 'browser-image-compression';

// Resim küçültme seçenekleri
const options = {
  maxSizeMB: 1.5,          // Dosya en fazla 1 MB olacak şekilde küçültülür.
  maxWidthOrHeight: 1920, // Resmin en geniş veya en uzun kenarı en fazla 1920px olur.
  useWebWorker: true,    // Küçültme işlemini arka planda yaparak arayüzün donmasını engeller.
};

export async function compressImage(file: File): Promise<File> {
  console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  
  try {
    // Kütüphane zaten bir Blob döndürüyor, doğrudan onu kullanalım.
    const compressedBlob = await imageCompression(file, options);
    console.log(`Compression successful, new size: ${(compressedBlob.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedBlob;
  } catch (error) {
    console.error(`Compression failed for ${file.name}:`, error);
    // Hata olursa, yine de orijinal dosyayı (ki o da bir Blob türüdür) geri döndür.
    return file;
  }
}