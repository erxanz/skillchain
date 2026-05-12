import prisma from "@/lib/prisma";
import { courseCatalog, getCourseById } from "@/lib/courses";
import { mintCertificateNft } from "@/lib/nft";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const walletAddress = url.searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address dibutuhkan" }, { status: 400 });
    }

    const progressRecords = await prisma.progress.findMany({
      where: { userWalletAddress: walletAddress },
      include: { course: true },
      orderBy: { updatedAt: "desc" },
    });

    const certificateRecords = await prisma.certificate.findMany({
      where: { userWalletAddress: walletAddress },
    });

    const courseProgress = courseCatalog.map((course) => {
      const progress = progressRecords.find((record) => record.courseId === course.id);
      const certificate = certificateRecords.find((record) => record.courseId === course.id);

      return {
        ...course,
        progress: progress?.percentage ?? 0,
        completedAt: progress?.completedAt ?? null,
        nftAddress: certificate?.nftAddress ?? null,
        transactionSignature: certificate?.transactionSignature ?? null,
      };
    });

    return NextResponse.json({
      walletAddress,
      courses: courseProgress,
    });
  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json({ error: "Gagal mengambil progress" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { walletAddress, courseId, progress } = await req.json();

    if (!walletAddress || !courseId) {
      return NextResponse.json(
        { error: "Wallet address dan courseId dibutuhkan" },
        { status: 400 },
      );
    }

    const course = getCourseById(courseId);

    if (!course) {
      return NextResponse.json({ error: "Course tidak ditemukan" }, { status: 404 });
    }

    const normalizedProgress = Math.max(0, Math.min(100, Number(progress ?? 0)));
    const completedAt = normalizedProgress >= 100 ? new Date() : null;
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

    const updatedProgress = await prisma.progress.upsert({
      where: {
        userWalletAddress_courseId: {
          userWalletAddress: walletAddress,
          courseId: course.id,
        },
      },
      update: {
        percentage: normalizedProgress,
        completedAt,
      },
      create: {
        userWalletAddress: walletAddress,
        courseId: course.id,
        percentage: normalizedProgress,
        completedAt,
      },
    });

    let certificate = await prisma.certificate.findUnique({
      where: {
        userWalletAddress_courseId: {
          userWalletAddress: walletAddress,
          courseId: course.id,
        },
      },
    });

    let minted = false;

    if (normalizedProgress >= 100 && !certificate) {
      const mintResult = await mintCertificateNft({
        walletAddress,
        courseId: course.id,
        origin,
      });

      certificate = await prisma.certificate.create({
        data: {
          userWalletAddress: walletAddress,
          courseId: course.id,
          nftAddress: mintResult.nftAddress,
          transactionSignature: mintResult.transactionSignature,
          metadataUri: mintResult.metadataUri,
        },
      });
      minted = true;
    }

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      certificate,
      minted,
    });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json({ error: "Gagal menyimpan progress" }, { status: 500 });
  }
}