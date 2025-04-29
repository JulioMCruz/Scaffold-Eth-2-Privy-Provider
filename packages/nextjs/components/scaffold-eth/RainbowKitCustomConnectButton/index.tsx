/* eslint-disable prettier/prettier */
"use client";

// @refresh reset
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { usePrivy, useWallets } from "@privy-io/react-auth";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { useEnsAvatar, useEnsName } from "wagmi";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();

  const { login, authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets?.[0];
  const connectedAddress = user?.wallet?.address as Address | undefined;

  // 1. Get ENS name for the connected address
  const { data: ensName, isLoading: isEnsNameLoading } = useEnsName({
    address: connectedAddress,
    chainId: 1,
    query: {
      enabled: !!connectedAddress,
    },
  });

  // 2. Get ENS avatar using the resolved ENS name
  const { data: ensAvatarUrl, isLoading: isEnsAvatarLoading } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: 1,
    query: {
      enabled: !!ensName && !isEnsNameLoading,
    },
  });

  const getChainNumber = (chainId: string | undefined): number => {
    if (!chainId) return 0;
    return Number(chainId.split(":")[1]);
  };

  const isWrongNetwork = getChainNumber(activeWallet?.chainId) !== targetNetwork.id;

  function getChainName(chainId: number): string {
    if (!chainId) return "Unknown Network";

    const chainNames: Record<number, string> = {
      31337: "Hardhat",
      11155111: "Sepolia",
      84532: "Base Sepolia",
      8453: "Base",
    };

    return chainNames[chainId] || "Unknown Network";
  }

  // Determine the display name - ENS or formatted address
  const displayString =
    ensName ?? (connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "");
  const blockExplorerLink = connectedAddress ? getBlockExplorerAddressLink(targetNetwork, connectedAddress) : undefined;

  return (
    <>
      {authenticated ? (
        <>
          <div className="flex flex-col items-center mr-1">
            <Balance address={connectedAddress} className="min-h-0 h-auto" />
            <span className="text-xs" style={{ color: networkColor }}>
              {getChainName(getChainNumber(activeWallet?.chainId))}
            </span>
          </div>

          {isWrongNetwork ? (
            <WrongNetworkDropdown />
          ) : (
            <>
              {connectedAddress && (
                <>
                  <AddressInfoDropdown
                    address={connectedAddress}
                    displayName={displayString}
                    ensAvatar={ensAvatarUrl ?? undefined}
                    blockExplorerAddressLink={blockExplorerLink}
                  />
                  <AddressQRCodeModal address={connectedAddress} modalId="qrcode-modal" />
                </>
              )}
            </>
          )}

          {/* <button 
            className="btn btn-primary btn-sm"
            onClick={() => logout()}
          >
            Logout
          </button> */}
        </>
      ) : (
        <button className="btn btn-primary btn-sm" onClick={() => login({ loginMethods: ["wallet", "email"] })}>
          Connect Wallet
        </button>
      )}
    </>
  );
};
