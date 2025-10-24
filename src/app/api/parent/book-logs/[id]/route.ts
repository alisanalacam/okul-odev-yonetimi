import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyParent } from '@/lib/auth-utils';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parentPayload = await verifyParent(request);
  if (parentPayload instanceof NextResponse) return parentPayload;

  const bookLogId = parseInt((await params).id);

  const bookLogToDelete = await prisma.bookLog.findUnique({
    where: { id: bookLogId }
  });

  if (!bookLogToDelete) {
    return NextResponse.json({ message: "Kitap kaydı bulunamadı." }, { status: 404 });
  }

  await prisma.bookLog.delete({ where: { id: bookLogId } });

  return new NextResponse(null, { status: 204 });
}