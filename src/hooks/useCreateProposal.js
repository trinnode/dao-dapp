import React, { useCallback } from "react";
import useChairPerson from "./useChairPerson";
import useBalance from "./useBalance";
import { toast } from "sonner";
import { isAddressEqual, parseUnits } from "viem";
import { useAccount, useWalletClient, useWriteContract, usePublicClient } from "wagmi";
import { QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI, GOVERNANCE_TOKEN_ABI } from "../config/ABI";

const useCreateProposal = () => {
    const { address } = useAccount();
    const chairPerson = useChairPerson();
    const { balance } = useBalance();
    const walletClient = useWalletClient();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();

    const checkGovernanceTokenBalance = useCallback(async (requiredAmount) => {
        if (!publicClient) return false;

        try {
            const governanceBalance = await publicClient.readContract({
                address: import.meta.env.VITE_GOVERNANCE_TOKEN,
                abi: GOVERNANCE_TOKEN_ABI,
                functionName: "balanceOf",
                args: [import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT],
            });

            const requiredAmountWei = parseUnits(requiredAmount.toString(), 18);
            return governanceBalance >= requiredAmountWei;
        } catch (err) {
            console.error("Error checking governance token balance:", err);
            return false;
        }
    }, [publicClient]);

    return useCallback(
        async (description, recipient, amountInwei, durationInSeconds) => {
            if (!address || !walletClient) {
                toast.error("Not connected", {
                    description: "Kindly connect your address",
                });
                return;
            }
            
            if (chairPerson && !isAddressEqual(address, chairPerson)) {
                toast.error("Unauthorized", {
                    description: "This action is only available to the chairperson",
                });
                return;
            }

            // Check if user has sufficient balance for gas fees (optional check)
            if (parseFloat(balance) === 0) {
                toast.warning("Low balance", {
                    description: "You may not have sufficient tokens for gas fees",
                });
            }

            // Check if governance contract has enough tokens for the proposal amount
            const amountInEther = parseFloat(amountInwei) / Math.pow(10, 18);
            const hasEnoughTokens = await checkGovernanceTokenBalance(amountInEther);
            
            if (!hasEnoughTokens) {
                toast.error("Insufficient governance tokens", {
                    description: "The governance contract doesn't have enough tokens for this proposal amount",
                });
                return;
            }

            try {
                const txHash = await writeContractAsync({
                    address: import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT,
                    abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                    functionName: "createProposal",
                    args: [description, recipient, amountInwei, durationInSeconds],
                });

                console.log("txHash: ", txHash);

                // We Use publicClient to wait for transaction receipt
                const txReceipt = await publicClient.waitForTransactionReceipt({
                    hash: txHash,
                });

                if (txReceipt.status === "success") {
                    toast.success("Create proposal successful", {
                        description: "You have successfully created a proposal. It will appear shortly for all users.",
                    });
                } else {
                    toast.error("Transaction failed", {
                        description: "The transaction was not successful",
                    });
                }
            } catch (error) {
                console.error("Error creating proposal:", error);
                toast.error("Failed to create proposal", {
                    description: error.message || "An error occurred while creating the proposal",
                });
            }
        },
        [address, chairPerson, balance, walletClient, writeContractAsync, checkGovernanceTokenBalance, publicClient]
    );
};

export default useCreateProposal;
