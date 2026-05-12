"use client";

import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function WalletButton() {
  const { wallets } = useWallet();

  const installedWallet = wallets.find(
    (wallet) =>
      wallet.readyState === WalletReadyState.Installed ||
      wallet.readyState === WalletReadyState.Loadable,
  );

  if (!installedWallet) {
    return (
      <a
        href="https://phantom.app/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
      >
        Install Phantom
      </a>
    );
  }

  return (
    <WalletMultiButton className="!h-11 !rounded-full !bg-white !px-5 !text-sm !font-semibold !text-slate-950 hover:!bg-white/90" />
  );
}