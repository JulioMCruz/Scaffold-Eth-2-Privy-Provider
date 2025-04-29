"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, http, parseEther } from "viem";
import { hardhat } from "viem/chains";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { useTransactor } from "~~/hooks/scaffold-eth";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";

// Number of ETH faucet sends to an address
const NUM_OF_ETH = "1";
const FAUCET_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

const localWalletClient = createWalletClient({
  chain: hardhat,
  transport: http(),
});

/**
 * FaucetButton button which lets you grab eth for your primary Privy wallet.
 */
export const FaucetButton = () => {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const address = user?.wallet?.address;
  const connectedChainId = wallets?.[0]?.chainId;

  const { data: balance } = useWatchBalance({ address });
  const [loading, setLoading] = useState(false);
  const faucetTxn = useTransactor(localWalletClient);

  const getChainNumber = (chainId: string | undefined): number => {
    if (!chainId) return 0;
    return Number(chainId.split(":")[1]);
  };

  const sendETH = async () => {
    console.log(`[FaucetButton] sendETH called. Target address from usePrivy().user.wallet: ${address}`);
    if (!address) {
      console.error("[FaucetButton] No address found from usePrivy().user.wallet, cannot send ETH.");
      return;
    }
    try {
      setLoading(true);
      const txResult = await faucetTxn({
        account: FAUCET_ADDRESS,
        to: address,
        value: parseEther(NUM_OF_ETH),
      });
      console.log("[FaucetButton] Faucet Tx Sent:", txResult);
      setLoading(false);
    } catch (error) {
      console.error("⚡️ ~ file: FaucetButton.tsx:sendETH ~ error", error);
      setLoading(false);
    }
  };

  if (!authenticated || getChainNumber(connectedChainId) !== hardhat.id) {
    return null;
  }

  const isBalanceZero = balance && balance.value === 0n;

  return (
    <div
      className={
        !isBalanceZero
          ? "ml-1"
          : "ml-1 tooltip tooltip-bottom tooltip-secondary tooltip-open font-bold before:left-auto before:transform-none before:content-[attr(data-tip)] before:right-0"
      }
      data-tip="Grab funds from faucet"
    >
      <button className="btn btn-secondary btn-sm px-2 rounded-full" onClick={sendETH} disabled={loading || !address}>
        {!loading ? (
          <BanknotesIcon className="h-4 w-4" />
        ) : (
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </button>
    </div>
  );
};
