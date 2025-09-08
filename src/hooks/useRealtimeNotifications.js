import { useEffect } from "react";
import { usePublicClient } from "wagmi";
import { toast } from "sonner";
import { QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI, GOVERNANCE_TOKEN_ABI } from "../config/ABI";

const useRealtimeNotifications = () => {
    const publicClient = usePublicClient();
    
    const votingContractAddress = import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT;
    const tokenContractAddress = import.meta.env.VITE_GOVERNANCE_TOKEN;

    useEffect(() => {
        if (!publicClient || !votingContractAddress || !tokenContractAddress) return;

        const unwatchFunctions = [];

        try {
            // Listen for new proposals
            const unwatchProposalCreated = publicClient.watchContractEvent({
                address: votingContractAddress,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                eventName: "ProposalCreated",
                onLogs: (logs) => {
                    logs.forEach(() => {
                        toast.success("🗳️ New Proposal Created!", {
                            description: "A new proposal has been created and is now available for voting.",
                            duration: 5000,
                        });
                    });
                },
            });
            unwatchFunctions.push(unwatchProposalCreated);

            // Listen for votes
            const unwatchVoted = publicClient.watchContractEvent({
                address: votingContractAddress,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                eventName: "Voted",
                onLogs: (logs) => {
                    logs.forEach((log) => {
                        // Extract proposal ID if available
                        const proposalId = log.args?.proposalId;
                        const voter = log.args?.voter;
                        
                        let description = "A vote has been cast. Proposal statistics updated.";
                        if (proposalId !== undefined) {
                            description = `Vote cast on proposal #${proposalId}. Statistics updated.`;
                        }
                        
                        toast.info("📊 New Vote Cast!", {
                            description,
                            duration: 3000,
                        });

                        //console.log("Vote event detected:", { proposalId, voter, log });
                    });
                },
            });
            unwatchFunctions.push(unwatchVoted);

            // Listen for token transfers (major ones)
            const unwatchTransfer = publicClient.watchContractEvent({
                address: tokenContractAddress,
                abi: GOVERNANCE_TOKEN_ABI,
                eventName: "Transfer",
                onLogs: (logs) => {
                    logs.forEach((log) => {
                        // Only show notifications for significant transfers (> 10 tokens)
                        const amount = log.args?.value;
                        if (amount && amount > BigInt("10000000000000000000")) { // 10 tokens in wei
                            toast.info("💰 Large Token Transfer", {
                                description: "A significant token transfer has occurred.",
                                duration: 2000,
                            });
                        }
                    });
                },
            });
            unwatchFunctions.push(unwatchTransfer);

        } catch (error) {
            console.error("Error setting up real-time notifications:", error);
        }

        return () => {
            unwatchFunctions.forEach(unwatch => {
                if (unwatch) {
                    try {
                        unwatch();
                    } catch (error) {
                        console.error("Error cleaning up event listener:", error);
                    }
                }
            });
        };
    }, [publicClient, votingContractAddress, tokenContractAddress]);
};

export default useRealtimeNotifications;
