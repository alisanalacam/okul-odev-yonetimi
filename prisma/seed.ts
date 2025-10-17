import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding started...');

  // Önce mevcut verileri temizleyelim (opsiyonel)
  await prisma.user.deleteMany({});

  // Dummy kullanıcıları oluşturalım
  const admin = await prisma.user.create({
    data: {
      name: 'Ali Veli',
      email: 'admin@okul.com',
      phone: '5550000001',
      role: Role.admin,
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: 'Ayşe Yılmaz',
      email: 'ayse.yilmaz@okul.com',
      phone: '5550000002',
      role: Role.teacher,
    },
  });

  const parent = await prisma.user.create({
    data: {
      name: 'Fatma Kaya',
      email: 'fatma.kaya@okul.com',
      phone: '5550000003',
      role: Role.parent,
    },
  });

  console.log('Seeding finished.');
  console.log({ admin, teacher, parent });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });