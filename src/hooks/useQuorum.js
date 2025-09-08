import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI } from "../config/ABI";

const useQuorum = () => {
    const [quorumThreshold, setQuorumThreshold] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const publicClient = usePublicClient();

    const contractAddress = import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT;

    const fetchQuorum = useCallback(async () => {
        if (!publicClient || !contractAddress) return;

        setIsLoading(true);
        setError(null);

        try {
            const quorumValue = await publicClient.readContract({
                address: contractAddress,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                functionName: "quorum",
            });
            
            // Use the raw quorum value from the contract for accurate comparison
            const rawQuorum = typeof quorumValue === 'bigint' ? Number(quorumValue) : Number(quorumValue);
            //console.log("Raw quorum from contract:", rawQuorum);

            setQuorumThreshold(rawQuorum);
            
            //console.log("Quorum threshold set to:", rawQuorum);
        } catch (err) {
            console.error("Error fetching quorum:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [publicClient, contractAddress]);

    useEffect(() => {
        fetchQuorum();
    }, [fetchQuorum]);

    // Calculate quorum progress for a proposal
    const getQuorumProgress = useCallback((currentVotes) => {
        if (quorumThreshold === 0) return { percentage: 0, remaining: 0, reached: false };
        
        const percentage = Math.min((currentVotes / quorumThreshold) * 100, 100);
        const remaining = Math.max(quorumThreshold - currentVotes, 0);
        const reached = currentVotes >= quorumThreshold;

        return {
            percentage: Math.round(percentage),
            remaining,
            reached,
            threshold: quorumThreshold
        };
    }, [quorumThreshold]);

    return {
        quorumThreshold,
        isLoading,
        error,
        refetch: fetchQuorum,
        getQuorumProgress,
    };
};

export default useQuorum;
