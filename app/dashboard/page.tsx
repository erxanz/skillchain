"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { publicKey, disconnect } = useWallet();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [nftClaimed, setNftClaimed] = useState(false);

  // Simpan user ke database saat wallet terhubung
  useEffect(() => {
    const saveUser = async () => {
      if (publicKey) {
        try {
          await fetch("/api/user", {
            method: "POST",
            body: JSON.stringify({ walletAddress: publicKey.toBase58() }),
          });
          console.log("User tersimpan di DB!");
        } catch (error) {
          console.error("Gagal simpan user:", error);
        }
      }
    };

    saveUser();
  }, [publicKey]);

  const askAI = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setAiReply(data.reply);
    } catch {
      setAiReply("Maaf, AI sedang sibuk.");
    }
    setLoading(false);
  };

  const handleClaimNFT = async () => {
    if (!publicKey) return;
    
    setClaiming(true);
    try {
      const res = await fetch("/api/mint", {
        method: "POST",
        body: JSON.stringify({ 
          walletAddress: publicKey.toBase58(),
          courseId: "course-solana-101" // dummy ID course
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setNftClaimed(true);
        alert(`Selamat! NFT berhasil dikirim ke wallet: ${publicKey.toBase58()}`);
      }
    } catch (error) {
      alert("Gagal klaim NFT");
    }
    setClaiming(false);
  };

  const handleLogout = () => {
    disconnect();
    router.push("/");
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>
          Akses ditolak. Silakan kembali ke halaman awal dan connect wallet.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10 pb-4 border-b">
          <h1 className="text-3xl font-bold text-slate-800">
            SkillChain Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {publicKey.toBase58().slice(0, 6)}...
              {publicKey.toBase58().slice(-4)}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:underline">
              Disconnect
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Kolom Materi Kiri */}
          <div className="md:col-span-2 space-y-6">
            <div className="border p-6 rounded-xl shadow-sm bg-white">
              <h2 className="text-2xl font-bold mb-2">Pengenalan Solana</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Solana adalah blockchain dengan performa tinggi yang dirancang
                untuk mendukung dApps (decentralized applications) dengan
                kecepatan transaksi luar biasa dan biaya sangat rendah. Berbeda
                dengan blockchain lain, Solana menggunakan mekanisme konsensus
                unik yang disebut Proof of History (PoH).
              </p>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-500 mb-2">
                  <span>Progres Belajar</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: "100%" }}></div>
                </div>
              </div>

              {nftClaimed ? (
                <button disabled className="w-full bg-slate-300 text-slate-600 font-medium px-4 py-3 rounded-lg flex items-center justify-center gap-2">
                  ✓ NFT Certificate Claimed
                </button>
              ) : (
                <button 
                  onClick={handleClaimNFT}
                  disabled={claiming}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {claiming ? "Minting to Blockchain..." : "Claim NFT Certificate"}
                </button>
              )}
            </div>
          </div>

          {/* Kolom AI Tutor Kanan */}
          <div className="border p-6 rounded-xl shadow-sm bg-slate-50 flex flex-col h-125">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              ✨ AI Tutor
            </h2>

            <div className="flex-1 overflow-y-auto mb-4 bg-white p-4 rounded-lg border text-sm text-slate-700">
              {aiReply ? (
                <p className="leading-relaxed whitespace-pre-wrap">{aiReply}</p>
              ) : (
                <p className="text-slate-400 italic">
                  Tanyakan sesuatu tentang materi di samping...
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                className="border flex-1 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Apa itu Proof of History?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askAI()}
              />
              <button
                onClick={askAI}
                disabled={loading}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {loading ? "..." : "Kirim"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
