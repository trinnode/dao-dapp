import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI } from "../config/ABI";
import { formatVoteCount } from "../lib/voteUtils";

const useProposals = () => {
    const [proposals, setProposals] = useState([]);
    const [proposalCount, setProposalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const publicClient = usePublicClient();

    const contractAddress = import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT;

    const fetchProposalCount = useCallback(async () => {
        if (!publicClient || !contractAddress) return 0;

        try {
            const count = await publicClient.readContract({
                address: contractAddress,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                functionName: "getProposalCount",
            });
            
            const countNumber = Number(count);
            setProposalCount(countNumber);
            return countNumber;
        } catch (err) {
            console.error("Error fetching proposal count:", err);
            setError(err.message);
            setProposalCount(0);
            return 0;
        }
    }, [publicClient, contractAddress]);

    const fetchSingleProposal = useCallback(async (proposalId) => {
        if (!publicClient || !contractAddress) return null;

        try {
            console.log(`Fetching proposal ${proposalId}...`);
            const proposal = await publicClient.readContract({
                address: contractAddress,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                functionName: "proposals",
                args: [proposalId],
            });

            console.log(`Raw proposal ${proposalId} data:`, proposal);

            // Transform the proposal data into the correct format based on ABI
            // Contract returns: [description, recipient, amount, voteCount, deadline, executed]
            const formattedProposal = {
                id: proposalId,
                description: proposal[0],                    // string
                recipient: proposal[1],                     // address payable  
                amount: proposal[2],                        // uint256 (keep as BigInt for precision)
                voteCount: formatVoteCount(proposal[3]),    // Convert quadratic weight to readable vote count
                rawVoteCount: proposal[3],                  // Keep raw value for debugging
                deadline: Number(proposal[4]),              // uint256 -> number (timestamp)
                rawDeadline: proposal[4],                   // Keep raw deadline for debugging
                executed: proposal[5],                      // bool
            };

            console.log(`Formatted proposal ${proposalId}:`, formattedProposal);
            console.log(`Raw deadline: ${proposal[4]}, Formatted deadline: ${Number(proposal[4])}`);
            console.log(`Raw vote count: ${proposal[3]}, Formatted vote count: ${formatVoteCount(proposal[3])}`);
            return formattedProposal;
        } catch (err) {
            console.error(`Error fetching proposal ${proposalId}:`, err);
            return null;
        }
    }, [publicClient, contractAddress]);

    const fetchAllProposals = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log("Fetching proposal count...");
            const count = await fetchProposalCount();
            console.log("Proposal count:", count);
            
            if (count === 0) {
                console.log("No proposals found");
                setProposals([]);
                setIsLoading(false);
                return;
            }

            // Fetch all proposals from 0 to count-1
            console.log(`Fetching ${count} proposals...`);
            const proposalPromises = [];
            for (let i = 0; i < count; i++) {
                proposalPromises.push(fetchSingleProposal(i));
            }

            const allProposals = await Promise.all(proposalPromises);
            const validProposals = allProposals.filter(proposal => proposal !== null);
            
            console.log("Fetched proposals:", validProposals);
            setProposals(validProposals);
        } catch (err) {
            console.error("Error fetching all proposals:", err);
            setError(err.message);
            setProposals([]);
        } finally {
            setIsLoading(false);
        }
    }, [fetchProposalCount, fetchSingleProposal]);

    // Set up event listeners for real-time proposal updates
    useEffect(() => {
        if (!publicClient || !contractAddress) return;

        let unwatchProposalCreated;
        let unwatchVoteCast;

        const setupEventListeners = async () => {
            try {
                // Listen for ProposalCreated events
                unwatchProposalCreated = publicClient.watchContractEvent({
                    address: contractAddress,
                    abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                    eventName: "ProposalCreated",
                    onLogs: (logs) => {
                        console.log("ProposalCreated event detected:", logs);
                        // Refetch all proposals when a new one is created
                        fetchAllProposals();
                    },
                });

                // Listen for Voted events (if available in ABI)
                unwatchVoteCast = publicClient.watchContractEvent({
                    address: contractAddress,
                    abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                    eventName: "Voted",
                    onLogs: (logs) => {
                        console.log("Voted event detected:", logs);
                        // Refetch all proposals to update vote counts
                        fetchAllProposals();
                    },
                });
            } catch (err) {
                console.error("Error setting up proposal event listeners:", err);
            }
        };

        setupEventListeners();

        return () => {
            if (unwatchProposalCreated) {
                unwatchProposalCreated();
            }
            if (unwatchVoteCast) {
                unwatchVoteCast();
            }
        };
    }, [publicClient, contractAddress, fetchAllProposals]);

    // Initial proposals fetch
    useEffect(() => {
        fetchAllProposals();
    }, [fetchAllProposals]);

    const getProposalById = useCallback((proposalId) => {
        return proposals.find(proposal => proposal.id === proposalId);
    }, [proposals]);

    const refreshProposals = useCallback(() => {
        fetchAllProposals();
    }, [fetchAllProposals]);

    return {
        proposals,
        proposalCount,
        isLoading,
        error,
        getProposalById,
        refreshProposals,
        fetchSingleProposal,
    };
};

export default useProposals;