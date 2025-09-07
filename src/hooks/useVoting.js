import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI } from "../config/ABI";
import useBalance from "./useBalance";

const useVoting = () => {
    const { address } = useAccount();
    const { balance } = useBalance();
    const walletClient = useWalletClient();
    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const [userVoteStatus, setUserVoteStatus] = useState({}); // Track vote status per proposal

    // Check if user has voted on a specific proposal
    const checkVoteStatus = useCallback(async (proposalId) => {
        if (!address || !publicClient) return false;

        try {
            const hasVoted = await publicClient.readContract({
                address: import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                functionName: "hasVoted",
                args: [proposalId, address],
            });

            return hasVoted;
        } catch (error) {
            console.error(`Error checking vote status for proposal ${proposalId}:`, error);
            return false;
        }
    }, [address, publicClient]);

    // Update vote status for multiple proposals
    const updateVoteStatuses = useCallback(async (proposalIds) => {
        if (!address) return;

        try {
            const statusPromises = proposalIds.map(async (proposalId) => {
                const hasVoted = await checkVoteStatus(proposalId);
                return { proposalId, hasVoted };
            });

            const statuses = await Promise.all(statusPromises);
            const statusMap = {};
            statuses.forEach(({ proposalId, hasVoted }) => {
                statusMap[proposalId] = hasVoted;
            });

            setUserVoteStatus(statusMap);
        } catch (error) {
            console.error("Error updating vote statuses:", error);
        }
    }, [address, checkVoteStatus]);

    // Vote on a proposal (toggles vote - if voted, unvotes; if not voted, votes)
    const vote = useCallback(
        async (proposalId) => {
            if (!address || !walletClient) {
                toast.error("Not connected", {
                    description: "Please connect your wallet to vote",
                });
                return;
            }

            // Check if user has tokens to vote
            if (parseFloat(balance) === 0) {
                toast.error("No voting power", {
                    description: "You need governance tokens to vote",
                });
                return;
            }

            // Check current vote status
            const hasVoted = await checkVoteStatus(proposalId);
            const action = hasVoted ? "withdrawing vote" : "casting vote";

            try {
                toast.loading(`Processing ${action}...`);

                const txHash = await writeContractAsync({
                    address: import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT,
                    abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                    functionName: "vote",
                    args: [proposalId],
                });

                console.log("Vote txHash: ", txHash);

                const txReceipt = await publicClient.waitForTransactionReceipt({
                    hash: txHash,
                });

                if (txReceipt.status === "success") {
                    // Update local vote status
                    setUserVoteStatus(prev => ({
                        ...prev,
                        [proposalId]: !hasVoted
                    }));

                    const message = hasVoted ? "Vote withdrawn successfully" : "Vote cast successfully";
                    const description = hasVoted 
                        ? "Your vote has been withdrawn and will be reflected shortly"
                        : "Your vote has been recorded and will be reflected shortly";

                    toast.dismiss();
                    toast.success(message, { description });
                } else {
                    toast.dismiss();
                    toast.error("Transaction failed", {
                        description: "The transaction was not successful",
                    });
                }
            } catch (error) {
                toast.dismiss();
                console.error("Error voting:", error);
                toast.error(`Failed to ${action.split(' ')[0]} vote`, {
                    description: error.message || `An error occurred while ${action}`,
                });
            }
        },
        [address, balance, walletClient, publicClient, writeContractAsync, checkVoteStatus]
    );

    // Get user's vote status for a specific proposal
    const getUserVoteStatus = useCallback((proposalId) => {
        return userVoteStatus[proposalId] || false;
    }, [userVoteStatus]);

    return {
        vote,
        checkVoteStatus,
        updateVoteStatuses,
        getUserVoteStatus,
        canVote: address && parseFloat(balance) > 0,
        balance,
        userVoteStatus,
    };
};

export default useVoting;
