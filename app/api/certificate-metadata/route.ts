import { courseCatalog, getCourseById } from "@/lib/courses";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId") ?? courseCatalog[0].id;
  const walletAddress = url.searchParams.get("walletAddress") ?? "unknown-wallet";
  const course = getCourseById(courseId) ?? courseCatalog[0];
  const origin = url.origin;

  return NextResponse.json({
    name: `SkillChain Certificate - ${course.title}`,
    symbol: "SKILL",
    description: `Sertifikat NFT untuk wallet ${walletAddress} setelah menyelesaikan kelas ${course.title}.`,
    image: `${origin}/certificate.svg`,
    external_url: origin,
    attributes: [
      { trait_type: "Course ID", value: course.id },
      { trait_type: "Recipient", value: walletAddress },
      { trait_type: "Platform", value: "SkillChain" },
    ],
  });
}