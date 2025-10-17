import { S3Client, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";

// R2 S3 Client'ını tek bir yerde oluşturalım
const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT_URL!,
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  fileBuffer: Buffer,
  originalFilename: string,
  mimetype: string
): Promise<{ key: string; url: string }> {
  const bucketName = process.env.R2_BUCKET_NAME!;
  // Dosya adının benzersiz olmasını sağlıyoruz
  const fileExtension = originalFilename.split(".").pop();
  const key = `${uuid()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  // R2 Public URL'inizi .env dosyasında saklamanız önerilir.
  // Örn: R2_PUBLIC_URL=https://pub-....r2.dev
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { key, url: publicUrl };
}

export async function deleteFromR2(fileUrls: string[]): Promise<void> {
  if (!fileUrls || fileUrls.length === 0) {
    return; // Silinecek dosya yoksa bir şey yapma
  }

  const bucketName = process.env.R2_BUCKET_NAME!;

  // Gelen tam URL'lerden dosya anahtarlarını (key) çıkar
  const objectsToDelete = fileUrls.map(url => {
    try {
      const urlObject = new URL(url);
      // URL'nin path'indeki ilk '/' karakterini kaldır
      const key = urlObject.pathname.substring(1);
      return { Key: key };
    } catch (error) {
      console.error("Invalid URL for R2 deletion:", url);
      return null;
    }
  }).filter(Boolean) as { Key: string }[]; // Null olanları filtrele

  if (objectsToDelete.length === 0) {
    return;
  }

  const command = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: {
      Objects: objectsToDelete,
    },
  });

  try {
    await s3Client.send(command);
    console.log(`Successfully deleted ${objectsToDelete.length} objects from R2.`);
  } catch (error) {
    console.error("Error deleting objects from R2:", error);
    // Hata olsa bile devam et, veritabanı kaydını silmek daha önemli.
    // Bu hatalar loglanarak daha sonra incelenebilir.
  }
}