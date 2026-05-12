import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { walletAddress, courseId } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address dibutuhkan" },
        { status: 400 },
      );
    }

    // 1. Cari user di database
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // --- TEMPAT KODE METAPLEX (WEB3) ---
    // Di aplikasi aslinya, di sini kamu menaruh script @metaplex-foundation/js
    // untuk melakukan minting gambar public/images/certificate.png ke wallet user.
    // Karena ini butuh Private Key server, kita akan buat simulasi minting (jeda 3 detik) untuk MVP.

    await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulasi proses blockchain

    const dummyNftAddress = "NFT_" + Math.random().toString(36).substring(7); // Alamat NFT bohongan untuk demo

    // 2. Simpan sertifikat ke database
    const certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        nftAddress: dummyNftAddress,
      },
    });

    return NextResponse.json({
      success: true,
      message: "NFT Berhasil di-Mint!",
      certificate,
    });
  } catch (error) {
    console.error("Minting error:", error);
    return NextResponse.json(
      { error: "Gagal melakukan claim NFT" },
      { status: 500 },
    );
  }
}
