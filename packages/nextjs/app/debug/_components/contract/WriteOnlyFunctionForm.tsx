"use client";

import { useEffect, useState } from "react";
import { InheritanceTooltip } from "./InheritanceTooltip";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Abi, AbiFunction } from "abitype";
import {
  Address,
  TransactionReceipt,
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
  http,
} from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  ContractInput,
  TxReceipt,
  getFunctionInputKey,
  getInitialFormState,
  getParsedContractFunctionArgs,
  transformAbiFunction,
} from "~~/app/debug/_components/contract";
import { IntegerInput } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

type WriteOnlyFunctionFormProps = {
  abi: Abi;
  abiFunction: AbiFunction;
  onChange: () => void;
  contractAddress: Address;
  inheritedFrom?: string;
};

export const WriteOnlyFunctionForm = ({
  abi,
  abiFunction,
  onChange,
  contractAddress,
  inheritedFrom,
}: WriteOnlyFunctionFormProps) => {
  const [form, setForm] = useState<Record<string, any>>(() => getInitialFormState(abiFunction));
  const [txValue, setTxValue] = useState<string>("");

  const { address: wagmiAddress, chain, isConnected: isWagmiConnected, status: wagmiStatus } = useAccount();

  const { ready: privyReady, authenticated: isPrivyAuthenticated, user: privyUser } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets?.[0];

  const { targetNetwork } = useTargetNetwork();

  useEffect(() => {
    console.log("--- Debug State ---");
    console.log("Wagmi:", { isWagmiConnected, wagmiStatus, wagmiAddress, chainId: chain?.id });
    console.log("Privy:", {
      privyReady,
      isPrivyAuthenticated,
      userAddress: privyUser?.wallet?.address,
      activeWalletChainId: activeWallet?.chainId,
    });
    console.log("Target Network ID:", targetNetwork.id);
    if (activeWallet) {
      console.log("Inspecting Privy activeWallet:", activeWallet);
    }
  });

  const privyChainIdNumber = activeWallet?.chainId ? parseInt(activeWallet.chainId.split(":")[1], 10) : undefined;
  const isCorrectNetwork = activeWallet && privyChainIdNumber === targetNetwork.id;
  const writeDisabled = !activeWallet || !isCorrectNetwork;
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<string | undefined>();

  const handleWrite = async () => {
    if (!activeWallet || writeDisabled) return;

    console.log(`handleWrite called for function: ${abiFunction.name}`);
    setDisplayedTxResult(null);
    setResult(undefined);
    setIsPending(true);

    try {
      const provider = await activeWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: activeWallet.address as Address,
        transport: custom(provider),
        chain: targetNetwork,
      });

      const publicClient = createPublicClient({
        chain: targetNetwork,
        transport: http(),
      });

      const functionArgs = getParsedContractFunctionArgs(form);
      const encodedData = encodeFunctionData({
        abi: abi,
        functionName: abiFunction.name,
        args: functionArgs,
      });

      const estimatedGas = await publicClient.estimateGas({
        account: walletClient.account,
        to: contractAddress,
        data: encodedData,
        value: txValue ? BigInt(txValue) : undefined,
      });
      console.log("Estimated Gas:", estimatedGas);

      const transactionRequest = {
        account: walletClient.account,
        to: contractAddress,
        data: encodedData,
        value: txValue ? BigInt(txValue) : undefined,
        gas: estimatedGas,
      };

      console.log("Sending transaction via Viem Client:", transactionRequest);
      const txHash = await walletClient.sendTransaction(transactionRequest);
      console.log("Transaction Hash:", txHash);

      setResult(txHash);
      setDisplayedTxResult(txHash);
      onChange();
    } catch (error) {
      console.error("⚡️ Viem/Privy sendTransaction error:", error);
      setDisplayedTxResult(`Transaction failed: ${(error as Error).message}`);
    } finally {
      setIsPending(false);
    }
  };

  const [displayedTxResult, setDisplayedTxResult] = useState<TransactionReceipt | string | null>(null);

  const { data: txReceiptFromWagmi } = useWaitForTransactionReceipt({
    hash: result as `0x${string}` | undefined,
  });
  useEffect(() => {
    if (txReceiptFromWagmi) {
      setDisplayedTxResult(txReceiptFromWagmi);
    }
  }, [txReceiptFromWagmi]);

  const transformedFunction = transformAbiFunction(abiFunction);
  const inputs = transformedFunction.inputs.map((input, inputIndex) => {
    const key = getFunctionInputKey(abiFunction.name, input, inputIndex);
    return (
      <ContractInput
        key={key}
        setForm={updatedFormValue => {
          setDisplayedTxResult(null);
          setForm(updatedFormValue);
        }}
        form={form}
        stateObjectKey={key}
        paramType={input}
      />
    );
  });
  const zeroInputs = inputs.length === 0 && abiFunction.stateMutability !== "payable";

  return (
    <div className="py-5 space-y-3 first:pt-0 last:pb-1">
      <div className={`flex gap-3 ${zeroInputs ? "flex-row justify-between items-center" : "flex-col"}`}>
        <p className="font-medium my-0 break-words">
          {abiFunction.name}
          <InheritanceTooltip inheritedFrom={inheritedFrom} />
        </p>
        {inputs}
        {abiFunction.stateMutability === "payable" ? (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center ml-2">
              <span className="text-xs font-medium mr-2 leading-none">payable value</span>
              <span className="block text-xs font-extralight leading-none">wei</span>
            </div>
            <IntegerInput
              value={txValue}
              onChange={updatedTxValue => {
                setDisplayedTxResult(null);
                setTxValue(updatedTxValue);
              }}
              placeholder="value (wei)"
            />
          </div>
        ) : null}
        <div className="flex justify-between gap-2">
          {!zeroInputs && (
            <div className="flex-grow basis-0">
              {displayedTxResult && typeof displayedTxResult === "object" ? (
                <TxReceipt txResult={displayedTxResult} />
              ) : displayedTxResult ? (
                <span className="text-xs">{displayedTxResult}</span>
              ) : null}
            </div>
          )}
          <div
            className={`flex ${
              writeDisabled &&
              "tooltip before:content-[attr(data-tip)] before:right-[-10px] before:left-auto before:transform-none"
            }`}
            data-tip={`${writeDisabled && "Wallet not connected or in the wrong network"}`}
          >
            <button className="btn btn-secondary btn-sm" disabled={writeDisabled || isPending} onClick={handleWrite}>
              {isPending && <span className="loading loading-spinner loading-xs"></span>}
              Send 💸
            </button>
          </div>
        </div>
      </div>
      {zeroInputs && displayedTxResult ? (
        <div className="flex-grow basis-0">
          {typeof displayedTxResult === "object" ? (
            <TxReceipt txResult={displayedTxResult} />
          ) : (
            <span className="text-xs">{displayedTxResult}</span>
          )}
        </div>
      ) : null}
    </div>
  );
};
