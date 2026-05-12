"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (connected) {
      router.push("/dashboard");
    }
  }, [connected, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <h1 className="text-5xl font-bold mb-4 text-slate-900">SkillChain</h1>
      <p className="mb-8 text-slate-600 text-lg text-center max-w-md">
        Platform edukasi Web3. Hubungkan wallet Solana kamu untuk mulai belajar
        bersama AI Tutor dan dapatkan NFT.
      </p>
      <WalletMultiButton />
    </main>
  );
}
