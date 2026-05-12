import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";

import { getCourseById } from "@/lib/courses";

type MintCertificateInput = {
  walletAddress: string;
  courseId: string;
  origin: string;
};

type MintCertificateResult = {
  nftAddress: string;
  transactionSignature: string;
  metadataUri: string;
  mode: "metaplex" | "mock";
};

function parseSecretKey(rawSecret: string) {
  const parsedSecret = JSON.parse(rawSecret) as number[];

  return Keypair.fromSecretKey(new Uint8Array(parsedSecret));
}

function loadAuthority() {
  const rawSecret = process.env.METAPLEX_PRIVATE_KEY ?? process.env.SOLANA_PRIVATE_KEY;

  if (!rawSecret) {
    return null;
  }

  try {
    return parseSecretKey(rawSecret);
  } catch {
    return null;
  }
}

export async function mintCertificateNft({
  walletAddress,
  courseId,
  origin,
}: MintCertificateInput): Promise<MintCertificateResult> {
  const course = getCourseById(courseId) ?? {
    id: courseId,
    title: "SkillChain Course",
    description: "Certificate for completing a SkillChain learning track.",
  };
  const metadataUri = new URL(
    `/api/certificate-metadata?courseId=${encodeURIComponent(course.id)}&walletAddress=${encodeURIComponent(walletAddress)}`,
    origin,
  ).toString();

  const authority = loadAuthority();

  if (!authority) {
    const mockSuffix = `${course.id}-${Date.now().toString(36)}`;

    return {
      nftAddress: `demo-nft-${mockSuffix}`,
      transactionSignature: `demo-signature-${mockSuffix}`,
      metadataUri,
      mode: "mock",
    };
  }

  const connection = new Connection(
    process.env.SOLANA_RPC_URL ?? clusterApiUrl("devnet"),
    "confirmed",
  );
  const metaplex = Metaplex.make(connection).use(keypairIdentity(authority));
  const tokenOwner = new PublicKey(walletAddress);

  const { nft, response } = await metaplex.nfts().create({
    name: `SkillChain Certificate - ${course.title}`,
    symbol: "SKILL",
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    tokenOwner,
    isMutable: false,
  });

  return {
    nftAddress: nft.address.toBase58(),
    transactionSignature: response.signature,
    metadataUri,
    mode: "metaplex",
  };
}