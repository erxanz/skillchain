export type CourseCatalogItem = {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  lessons: string[];
};

export const courseCatalog: CourseCatalogItem[] = [
  {
    id: "solana-fundamentals",
    title: "Solana Fundamentals",
    description: "Memahami jaringan Solana, wallet, transaksi, dan cara kerja blockchain berkecepatan tinggi.",
    content:
      "Solana adalah blockchain berperforma tinggi yang mengutamakan throughput besar, biaya transaksi rendah, dan pengalaman pengguna yang cepat. Fokus utama materi ini adalah memahami wallet, transaksi, dan alasan Solana cocok untuk aplikasi edukasi Web3.",
    duration: "2 jam",
    lessons: [
      "Pengenalan blockchain dan wallet",
      "Proof of History dan keunggulan Solana",
      "Praktik transaksi dan koneksi Phantom",
    ],
  },
  {
    id: "ai-tutor-workflow",
    title: "AI Tutor Workflow",
    description: "Membuat alur tanya jawab materi, ringkasan, dan kuis otomatis dengan Gemini atau OpenAI.",
    content:
      "AI Tutor membantu siswa memahami materi dengan cara yang interaktif. Prompt dapat berisi permintaan ringkasan, penjelasan konsep, atau pembuatan kuis. Sistem akan menggabungkan konteks materi dengan instruksi belajar yang jelas.",
    duration: "1.5 jam",
    lessons: [
      "Merancang prompt tutor yang aman dan konsisten",
      "Integrasi Gemini / OpenAI",
      "Membangun panel chat di halaman materi",
    ],
  },
  {
    id: "nft-certificate-minting",
    title: "NFT Certificate Minting",
    description: "Menghubungkan progress 100% dengan minting sertifikat NFT di Solana Devnet.",
    content:
      "Saat progress kursus mencapai 100%, sistem akan memicu minting sertifikat NFT ke wallet pengguna. Untuk tahap MVP, minting dilakukan di Devnet agar aman dan tidak memerlukan biaya sungguhan.",
    duration: "1 jam",
    lessons: [
      "Menyusun metadata sertifikat",
      "Minting NFT dengan Metaplex JS SDK",
      "Menyimpan transaksi dan alamat NFT di database",
    ],
  },
];

export function getCourseById(courseId: string) {
  return courseCatalog.find((course) => course.id === courseId);
}