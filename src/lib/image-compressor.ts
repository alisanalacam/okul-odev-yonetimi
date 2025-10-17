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
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    // Küçültme başarısız olursa, orijinal dosyayı geri döndür.
    return file;
  }
}