"use client";

import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Address, createPublicClient, formatEther, http } from "viem";
import { useBlockNumber } from "wagmi";
import { useDisplayUsdMode } from "~~/hooks/scaffold-eth/useDisplayUsdMode";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";

// Define the expected balance state type
type ManualBalanceData = {
  value: bigint;
  symbol: string;
  decimals: number;
} | null;

type BalanceProps = {
  address?: Address;
  className?: string;
  usdMode?: boolean;
};

/**
 * Display (ETH & USD) balance of an ETH address.
 */
export const Balance = ({ address, className = "", usdMode }: BalanceProps) => {
  // Log the address prop on every render
  console.log("[Balance Render] Address prop:", address);

  const { targetNetwork } = useTargetNetwork();
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const isNativeCurrencyPriceFetching = useGlobalState(state => state.nativeCurrency.isFetching);

  // State for manual balance fetching
  const [balanceData, setBalanceData] = useState<ManualBalanceData>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Watch for new blocks to trigger balance refetch
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Fetch balance manually using Viem Public Client
  useEffect(() => {
    // Log entry into the effect
    console.log("[Balance Effect] Running effect. Address:", address, "Block:", blockNumber);
    if (!address) {
      console.log("[Balance Effect] No address, clearing data.");
      setBalanceData(null);
      return;
    }
    // Log that we are proceeding to fetch
    console.log(`[Balance Effect] Proceeding to fetch balance for ${address} on network ${targetNetwork.name}`);

    const fetchBalance = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const publicClient = createPublicClient({
          chain: targetNetwork,
          transport: http(),
        });
        const fetchedBalanceValue = await publicClient.getBalance({ address });
        // Log the raw fetched value
        console.log("[Balance Effect] Raw fetched balance value:", fetchedBalanceValue);
        setBalanceData({
          value: fetchedBalanceValue,
          symbol: targetNetwork.nativeCurrency.symbol,
          decimals: targetNetwork.nativeCurrency.decimals,
        });
      } catch (error) {
        // Ensure errors are logged
        console.error("[Balance Effect] Error fetching balance:", error);
        setIsError(true);
        setBalanceData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    // Refetch balance whenever address or blockNumber changes
  }, [address, blockNumber, targetNetwork]);

  // Log before returning the JSX
  console.log("[Balance Render] Current balanceData state:", balanceData);

  // Use the local display mode hook
  const { displayUsdMode, toggleDisplayUsdMode } = useDisplayUsdMode({ defaultUsdMode: usdMode });

  // Check local state for loading/error
  if (!address || isLoading || (isNativeCurrencyPriceFetching && nativeCurrencyPrice === 0)) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || balanceData === null) {
    // Also handle null balanceData after fetch attempt
    return (
      <div className="border-2 border-base-content/30 rounded-md px-2 flex flex-col items-center max-w-fit cursor-pointer">
        <div className="text-warning">Error</div>
      </div>
    );
  }

  // Use balanceData from state
  const formattedBalance = Number(formatEther(balanceData.value));

  return (
    <button
      className={`btn btn-sm btn-ghost flex flex-col font-normal items-center hover:bg-transparent ${className}`}
      onClick={toggleDisplayUsdMode}
      type="button"
    >
      <div className="w-full flex items-center justify-center">
        {displayUsdMode ? (
          <>
            <span className="text-[0.8em] font-bold mr-1">$</span>
            <span>{(formattedBalance * nativeCurrencyPrice).toFixed(2)}</span>
          </>
        ) : (
          <>
            <span>{formattedBalance.toFixed(4)}</span>
            <span className="text-[0.8em] font-bold ml-1">{balanceData.symbol}</span>
          </>
        )}
      </div>
    </button>
  );
};
