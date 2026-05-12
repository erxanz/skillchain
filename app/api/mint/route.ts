import prisma from "@/lib/prisma";
import { getCourseById } from "@/lib/courses";
import { mintCertificateNft } from "@/lib/nft";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const walletAddress = typeof body.walletAddress === "string" ? body.walletAddress.trim() : "";
    const courseId = typeof body.courseId === "string" ? body.courseId.trim() : "";

    if (!walletAddress || !courseId) {
      return NextResponse.json(
        { error: "walletAddress dan courseId dibutuhkan" },
        { status: 400 },
      );
    }

    const course = getCourseById(courseId);

    if (!course) {
      return NextResponse.json({ error: "Course tidak ditemukan" }, { status: 404 });
    }

    const origin = new URL(req.url).origin;

    await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress },
    });

    await prisma.course.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        description: course.description,
        content: course.content,
        duration: course.duration,
      },
      create: {
        id: course.id,
        title: course.title,
        description: course.description,
        content: course.content,
        duration: course.duration,
      },
    });

    const existingCertificate = await prisma.certificate.findUnique({
      where: {
        userWalletAddress_courseId: {
          userWalletAddress: walletAddress,
          courseId: course.id,
        },
      },
    });

    if (existingCertificate) {
      return NextResponse.json({
        success: true,
        minted: false,
        certificate: existingCertificate,
      });
    }

    const mintResult = await mintCertificateNft({
      walletAddress,
      courseId: course.id,
      origin,
    });

    const certificate = await prisma.certificate.create({
      data: {
        userWalletAddress: walletAddress,
        courseId: course.id,
        nftAddress: mintResult.nftAddress,
        transactionSignature: mintResult.transactionSignature,
        metadataUri: mintResult.metadataUri,
      },
    });

    return NextResponse.json({
      success: true,
      minted: true,
      mode: mintResult.mode,
      certificate,
    });
  } catch (error) {
    console.error("Minting error:", error);
    return NextResponse.json({ error: "Gagal melakukan claim NFT" }, { status: 500 });
  }
}
