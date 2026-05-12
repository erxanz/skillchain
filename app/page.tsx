"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

import WalletButton from "./components/WalletButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (connected) {
      router.push("/dashboard");
    }
  }, [connected, router]);

  return (
    <main className="min-h-screen overflow-hidden px-6 py-8 text-slate-900 sm:px-10 lg:px-12">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center gap-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-sky-700 shadow-sm backdrop-blur">
              SkillChain MVP
            </div>
            <h1 className="max-w-2xl font-heading text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Belajar Web3, tanya AI Tutor, lalu terima sertifikat NFT.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Hubungkan Phantom Wallet, pilih materi, minta ringkasan atau kuis, dan simpan progres kursus ke database. Saat progress mencapai 100%, sistem akan memicu minting NFT di Solana Devnet.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <WalletButton />
              <Button asChild variant="outline" className="h-11 rounded-full border-slate-200 bg-white/80 px-5">
                <Link href="/dashboard">Lihat Dashboard</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 shadow-sm">Wallet Connect</span>
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 shadow-sm">AI Tutor</span>
              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 shadow-sm">NFT Certificate</span>
            </div>
          </div>

          <Card className="border-white/70 bg-white/80 shadow-2xl shadow-slate-900/5 backdrop-blur">
            <CardHeader>
              <CardTitle>Rangkaian MVP</CardTitle>
              <CardDescription>Alur inti yang sudah siap dipakai untuk demo dan pengembangan lanjut.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-sky-300">Hari 1</p>
                <p className="text-lg font-semibold">Pondasi UI, login wallet, dan dashboard belajar.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-sky-700">Hari 2</p>
                <p className="text-lg font-semibold text-slate-950">Prisma, AI Tutor, dan sinkronisasi materi.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-sky-50 p-5">
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-sky-700">Hari 3</p>
                <p className="text-lg font-semibold text-slate-950">Minting NFT, finalisasi progress, dan deployment.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/70 bg-white/75 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">Phantom wallet terhubung lewat komponen wallet-adapter UI.</p>
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/75 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>AI Tutor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">Prompt siswa dikirim ke Gemini atau OpenAI dengan konteks materi aktif.</p>
            </CardContent>
          </Card>
          <Card className="border-white/70 bg-white/75 shadow-lg backdrop-blur">
            <CardHeader>
              <CardTitle>NFT Certificate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">Progress 100% memicu minting sertifikat ke wallet pengguna di Devnet.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}