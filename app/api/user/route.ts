import prisma from "@/lib/prisma"; // Pastikan file lib/prisma.ts sudah kamu buat
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address dibutuhkan" },
        { status: 400 },
      );
    }

    // Upsert: Cek apakah user sudah ada. Jika belum, buat baru. Jika sudah, biarkan.
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan user" },
      { status: 500 },
    );
  }
}
