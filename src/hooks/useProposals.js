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
            //console.log(`Fetching proposal ${proposalId}...`);
            const proposal = await publicClient.readContract({
                address: contractAddress,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                functionName: "proposals",
                args: [proposalId],
            });

            //console.log(`Raw proposal ${proposalId} data:`, proposal);

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

            //console.log(`Formatted proposal ${proposalId}:`, formattedProposal);
            //console.log(`Raw deadline: ${proposal[4]}, Formatted deadline: ${Number(proposal[4])}`);
            //console.log(`Raw vote count: ${proposal[3]}, Formatted vote count: ${formatVoteCount(proposal[3])}`);
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
            //console.log("Fetching proposal count...");
            const count = await fetchProposalCount();
            //console.log("Proposal count:", count);
            
            if (count === 0) {
                //console.log("No proposals found");
                setProposals([]);
                setIsLoading(false);
                return;
            }

            // Fetch all proposals from 0 to count-1
            //console.log(`Fetching ${count} proposals...`);
            const proposalPromises = [];
            for (let i = 0; i < count; i++) {
                proposalPromises.push(fetchSingleProposal(i));
            }

            const allProposals = await Promise.all(proposalPromises);
            const validProposals = allProposals.filter(proposal => proposal !== null);
            
            //console.log("Fetched proposals:", validProposals);
            setProposals(validProposals);
        } catch (err) {
            console.error("Error fetching all proposals:", err);
            setError(err.message);
            setProposals([]);
        } finally {
            setIsLoading(false);
        }
    }, [fetchProposalCount, fetchSingleProposal]);

    // Update specific proposals (for real-time vote updates)
    const updateSpecificProposals = useCallback(async (proposalIds) => {
        try {
            //console.log(`Updating specific proposals: ${proposalIds.join(', ')}`);
            
            const updatedProposalPromises = proposalIds.map(id => fetchSingleProposal(id));
            const updatedProposals = await Promise.all(updatedProposalPromises);
            
            // Update only the specific proposals in the state
            setProposals(prev => {
                const updated = [...prev];
                updatedProposals.forEach(updatedProposal => {
                    if (updatedProposal) {
                        const index = updated.findIndex(p => p.id === updatedProposal.id);
                        if (index !== -1) {
                            updated[index] = updatedProposal;
                            //console.log(`Updated proposal ${updatedProposal.id} with new vote count: ${updatedProposal.voteCount}`);
                        }
                    }
                });
                return updated;
            });
        } catch (err) {
            console.error("Error updating specific proposals:", err);
            // Fallback to refetching all proposals
            fetchAllProposals();
        }
    }, [fetchSingleProposal, fetchAllProposals]);

    // Set up event listeners for real-time proposal updates
    useEffect(() => {
        if (!publicClient || !contractAddress) return;

        let unwatchProposalCreated;
        let unwatchVoteCast;
        let isComponentMounted = true;

        const setupEventListeners = async () => {
            try {
                // Listen for ProposalCreated events
                unwatchProposalCreated = publicClient.watchContractEvent({
                    address: contractAddress,
                    abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                    eventName: "ProposalCreated",
                    onLogs: (logs) => {
                        if (!isComponentMounted) return;
                        //console.log("ProposalCreated event detected:", logs);
                        // Refetch all proposals when a new one is created
                        fetchAllProposals();
                    },
                });

                // Listen for Voted events - optimized to only update the affected proposal
                unwatchVoteCast = publicClient.watchContractEvent({
                    address: contractAddress,
                    abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                    eventName: "Voted",
                    onLogs: (logs) => {
                        if (!isComponentMounted) return;
                        //console.log("Voted event detected:", logs);
                        
                        // Extract proposal IDs from the vote events and update only those proposals
                        const proposalIdsToUpdate = new Set();
                        logs.forEach((log) => {
                            if (log.args && typeof log.args.proposalId !== 'undefined') {
                                const proposalId = Number(log.args.proposalId);
                                proposalIdsToUpdate.add(proposalId);
                                //console.log(`Vote detected for proposal ${proposalId}`);
                            }
                        });

                        // Update only the affected proposals
                        if (proposalIdsToUpdate.size > 0) {
                            updateSpecificProposals(Array.from(proposalIdsToUpdate));
                        } else {
                            // Fallback: if we can't get specific proposal IDs, refetch all
                            //console.log("Could not determine specific proposal IDs, refetching all proposals");
                            fetchAllProposals();
                        }
                    },
                });
            } catch (err) {
                console.error("Error setting up proposal event listeners:", err);
            }
        };

        setupEventListeners();

        return () => {
            isComponentMounted = false;
            try {
                if (unwatchProposalCreated) {
                    unwatchProposalCreated();
                }
                if (unwatchVoteCast) {
                    unwatchVoteCast();
                }
            } catch (error) {
                console.error("Error cleaning up event listeners:", error);
            }
        };
    }, [publicClient, contractAddress, fetchAllProposals, updateSpecificProposals]);

    // Initial proposals fetch
    useEffect(() => {
        fetchAllProposals();
    }, [fetchAllProposals]);

    const getProposalById = useCallback((proposalId) => {
        return proposals.find(proposal => proposal.id === proposalId);
    }, [proposals]);

    return {
        proposals,
        proposalCount,
        isLoading,
        error,
        getProposalById,
        refreshProposals: fetchAllProposals,
        fetchSingleProposal,
        updateSpecificProposals, // Export for manual updates
    };
};

export default useProposals;