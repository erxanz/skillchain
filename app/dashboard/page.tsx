"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { BookOpen, Brain, CheckCircle2, ChevronRight, CircleAlert, Sparkles } from "lucide-react";

import { courseCatalog, type CourseCatalogItem } from "@/lib/courses";
import WalletButton from "../components/WalletButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type CourseProgressView = CourseCatalogItem & {
  progress: number;
  completedAt: string | null;
  nftAddress: string | null;
  transactionSignature: string | null;
};

const defaultCourseId = courseCatalog[0]?.id ?? "";

export default function DashboardPage() {
  const { publicKey, disconnect } = useWallet();
  const [courses, setCourses] = useState<CourseProgressView[]>(
    courseCatalog.map((course, index) => ({
      ...course,
      progress: index === 0 ? 35 : index === 1 ? 20 : 0,
      completedAt: null,
      nftAddress: null,
      transactionSignature: null,
    })),
  );
  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourseId);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Pilih materi untuk mulai belajar.");

  const connectedWallet = publicKey?.toBase58() ?? "";

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? courses[0],
    [courses, selectedCourseId],
  );

  const completionStats = useMemo(() => {
    const total = courses.length || 1;
    const average = Math.round(
      courses.reduce((sum, course) => sum + course.progress, 0) / total,
    );
    const completed = courses.filter((course) => course.progress >= 100).length;

    return { average, completed, total };
  }, [courses]);

  useEffect(() => {
    async function loadProgress() {
      if (!connectedWallet) {
        return;
      }

      try {
        const response = await fetch(`/api/progress?walletAddress=${connectedWallet}`);
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { courses?: CourseProgressView[] };
        const remoteCourses = data.courses;

        if (remoteCourses?.length) {
          setCourses(remoteCourses);
          setSelectedCourseId((current) =>
            remoteCourses.some((course) => course.id === current) ? current : remoteCourses[0].id,
          );
        }
      } catch {
        // Keep seeded demo data when the database is not ready yet.
      }
    }

    void loadProgress();
  }, [connectedWallet]);

  if (!publicKey) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-10">
        <Card className="max-w-lg border-white/70 bg-white/90 shadow-2xl backdrop-blur">
          <CardHeader>
            <CardTitle>Akses dashboard butuh wallet</CardTitle>
            <CardDescription>Hubungkan Phantom Wallet untuk melihat kelas, progress, dan AI Tutor.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <WalletButton />
            <Button variant="outline" asChild>
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  async function saveProgress(courseId: string, nextProgress: number) {
    setSavingProgress(true);
    setStatusMessage("Menyimpan progress dan memeriksa sertifikat...");

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: connectedWallet,
          courseId,
          progress: nextProgress,
        }),
      });

      const data = (await response.json()) as {
        progress?: { courseId: string; percentage: number; completedAt?: string | null };
        certificate?: { nftAddress?: string | null; transactionSignature?: string | null } | null;
        minted?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan progress");
      }

      setCourses((currentCourses) =>
        currentCourses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                progress: data.progress?.percentage ?? nextProgress,
                completedAt: data.progress?.completedAt ?? course.completedAt,
                nftAddress: data.certificate?.nftAddress ?? course.nftAddress,
                transactionSignature: data.certificate?.transactionSignature ?? course.transactionSignature,
              }
            : course,
        ),
      );

      setStatusMessage(
        data.minted
          ? "Progress 100% tercapai. Sertifikat NFT berhasil dibuat."
          : "Progress tersimpan di database.",
      );
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Gagal menyimpan progress.");
    } finally {
      setSavingProgress(false);
    }
  }

  async function askTutor() {
    if (!prompt.trim()) {
      setReply("Masukkan pertanyaan terlebih dahulu.");
      return;
    }

    setLoadingReply(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          material: selectedCourse?.content,
          courseTitle: selectedCourse?.title,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Gagal mendapatkan jawaban AI");
      }

      setReply(data.reply || "Tutor tidak memberikan jawaban.");
    } catch (error) {
      setReply(error instanceof Error ? error.message : "Tutor AI sedang tidak tersedia.");
    } finally {
      setLoadingReply(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 text-white shadow-2xl shadow-slate-900/10">
          <div className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-cyan-200">
                <Sparkles className="h-4 w-4" />
                SkillChain Dashboard
              </div>
              <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                Dashboard belajar yang menghubungkan progress, AI tutor, dan NFT certificate.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Wallet kamu sudah terhubung. Pilih kelas, lanjutkan materi, tanya AI, lalu selesaikan progress untuk memicu minting sertifikat di Solana Devnet.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{completionStats.completed}/{completionStats.total} course selesai</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Rata-rata {completionStats.average}% progress</span>
              </div>
            </div>

            <Card className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription className="text-slate-300">Aksi cepat untuk demo dan pengujian alur MVP.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="h-11 w-full justify-between rounded-xl bg-cyan-400 px-4 text-slate-950 hover:bg-cyan-300"
                  onClick={() => saveProgress(selectedCourse.id, 100)}
                  disabled={savingProgress}
                >
                  <span>Selesaikan kelas terpilih</span>
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  className="h-11 w-full justify-between rounded-xl border-white/10 bg-white/10 px-4 text-white hover:bg-white/15"
                  variant="outline"
                  onClick={() => saveProgress(selectedCourse.id, Math.min(100, selectedCourse.progress + 25))}
                  disabled={savingProgress}
                >
                  <span>Naikkan progress 25%</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  className="h-11 w-full justify-between rounded-xl border-white/10 bg-transparent px-4 text-white hover:bg-white/10"
                  variant="outline"
                  onClick={() => disconnect()}
                >
                  <span>Disconnect wallet</span>
                  <CircleAlert className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/70 bg-white/85 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle>Daftar Kelas</CardTitle>
              <CardDescription>Setiap kartu tersambung ke progress dan status sertifikat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courses.map((course) => {
                const isSelected = course.id === selectedCourseId;
                const hasCertificate = Boolean(course.nftAddress);

                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${isSelected ? "border-cyan-400 bg-cyan-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          <BookOpen className="h-3.5 w-3.5" />
                          {course.duration}
                        </p>
                        <h3 className="text-lg font-semibold text-slate-950">{course.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{course.description}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${hasCertificate ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {hasCertificate ? "Sertifikat ada" : `${course.progress}%`}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-white/70 bg-white/85 shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle>{selectedCourse.title}</CardTitle>
                <CardDescription>{selectedCourse.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Materi</span>
                    <span>{selectedCourse.progress}% complete</span>
                  </div>
                  <Progress value={selectedCourse.progress} className="h-3" />
                  <p className="text-sm leading-7 text-slate-700">{selectedCourse.content}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {selectedCourse.lessons.map((lesson) => (
                    <div key={lesson} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm">
                      {lesson}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button className="h-11 rounded-full px-5" onClick={() => saveProgress(selectedCourse.id, 100)} disabled={savingProgress}>
                    {savingProgress ? "Menyimpan..." : "Selesaikan dan Mint NFT"}
                  </Button>
                  <Button variant="outline" className="h-11 rounded-full px-5" onClick={() => saveProgress(selectedCourse.id, Math.min(100, selectedCourse.progress + 10))} disabled={savingProgress}>
                    Naikkan 10%
                  </Button>
                </div>

                {selectedCourse.nftAddress ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">NFT certificate sudah tersedia</p>
                      <span className="rounded-full border border-emerald-300 bg-white px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700">
                        {selectedCourse.transactionSignature?.startsWith("demo-") ? "Mode demo" : "On-chain"}
                      </span>
                    </div>
                    <p className="mt-1 break-all">{selectedCourse.nftAddress}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-500">
                        <Link href="/certificate.svg" target="_blank" rel="noreferrer">
                          Lihat sertifikat
                        </Link>
                      </Button>
                      {selectedCourse.transactionSignature && !selectedCourse.transactionSignature.startsWith("demo-") ? (
                        <Button asChild size="sm" variant="outline" className="rounded-full border-emerald-300 text-emerald-800 hover:bg-emerald-100">
                          <Link
                            href={`https://explorer.solana.com/tx/${selectedCourse.transactionSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Buka Explorer
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <p className="text-sm text-slate-500">{statusMessage}</p>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-slate-950 text-white shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-cyan-300" />
                  AI Tutor
                </CardTitle>
                <CardDescription className="text-slate-300">Ringkas materi, minta penjelasan, atau buat kuis dari kelas yang sedang dipilih.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="min-h-40 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
                  {reply || "Tulis prompt seperti: 'Tolong ringkas materi ini' atau 'Buatkan saya 3 soal kuis'."}
                </div>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Tolong ringkas materi ini..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-300"
                />
                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  <button type="button" onClick={() => setPrompt("Tolong ringkas materi ini dalam 5 poin.")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10">
                    Ringkas materi
                  </button>
                  <button type="button" onClick={() => setPrompt("Buatkan saya 3 soal kuis beserta jawaban singkat.")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10">
                    Buat kuis
                  </button>
                  <button type="button" onClick={() => setPrompt("Jelaskan materi ini dengan bahasa yang sangat sederhana.")} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10">
                    Jelaskan sederhana
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button className="h-11 rounded-full px-5" onClick={askTutor} disabled={loadingReply}>
                    {loadingReply ? "Memproses..." : "Kirim ke AI Tutor"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}