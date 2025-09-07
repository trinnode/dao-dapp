import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { formatEther } from "viem";

const useContractBalance = () => {
    const [contractBalance, setContractBalance] = useState("0");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const publicClient = usePublicClient();
    
    const contractAddress = import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT;

    const fetchContractBalance = useCallback(async () => {
        if (!publicClient || !contractAddress) {
            console.log("Missing publicClient or contractAddress");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("Fetching contract balance for:", contractAddress);
            
            // Get the ETH balance of the contract
            const balance = await publicClient.getBalance({
                address: contractAddress,
            });

            console.log("Raw contract balance:", balance.toString());
            
            // Convert from wei to ETH
            const formattedBalance = formatEther(balance);
            console.log("Formatted contract balance:", formattedBalance);
            
            setContractBalance(formattedBalance);
        } catch (err) {
            console.error("Error fetching contract balance:", err);
            setError(err.message);
            setContractBalance("0");
        } finally {
            setIsLoading(false);
        }
    }, [publicClient, contractAddress]);

    // Set up real-time balance updates by listening to block changes
    useEffect(() => {
        if (!publicClient || !contractAddress) return;

        // Initial fetch
        fetchContractBalance();

        // Listen for new blocks to update balance
        const unwatchBlocks = publicClient.watchBlocks({
            onBlock: () => {
                fetchContractBalance();
            },
        });

        return () => {
            if (unwatchBlocks) {
                unwatchBlocks();
            }
        };
    }, [publicClient, contractAddress, fetchContractBalance]);

    return {
        contractBalance,
        isLoading,
        error,
        refreshBalance: fetchContractBalance,
    };
};

export default useContractBalance;
