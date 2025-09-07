import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { GOVERNANCE_TOKEN_ABI } from "../config/ABI";

const useBalance = () => {
    const [balance, setBalance] = useState("0");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const contractAddress = import.meta.env.VITE_GOVERNANCE_TOKEN;

    const fetchBalance = useCallback(async () => {
        if (!address || !publicClient || !contractAddress) {
            setBalance("0");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await publicClient.readContract({
                address: contractAddress,
                abi: GOVERNANCE_TOKEN_ABI,
                functionName: "balanceOf",
                args: [address],
            });

            // Format the balance from wei to ether (assuming 18 decimals)
            const formattedBalance = formatUnits(result, 18);
            setBalance(formattedBalance);
        } catch (err) {
            console.error("Error fetching balance:", err);
            setError(err.message);
            setBalance("0");
            // Don't show error toast for balance fetch failures
        } finally {
            setIsLoading(false);
        }
    }, [address, publicClient, contractAddress]);

    // Set up event listeners for real-time balance updates
    useEffect(() => {
        if (!address || !publicClient || !contractAddress) return;

        let unwatchOutgoing;
        let unwatchIncoming;

        const setupEventListeners = async () => {
            try {
                // Listen for outgoing Transfer events (when user sends tokens)
                unwatchOutgoing = publicClient.watchContractEvent({
                    address: contractAddress,
                    abi: GOVERNANCE_TOKEN_ABI,
                    eventName: "Transfer",
                    args: {
                        from: address,
                    },
                    onLogs: (logs) => {
                        console.log("Transfer event detected (outgoing):", logs);
                        fetchBalance(); // Refetch balance when tokens are sent
                    },
                });

                // Listen for incoming Transfer events (when user receives tokens)
                unwatchIncoming = publicClient.watchContractEvent({
                    address: contractAddress,
                    abi: GOVERNANCE_TOKEN_ABI,
                    eventName: "Transfer",
                    args: {
                        to: address,
                    },
                    onLogs: (logs) => {
                        console.log("Transfer event detected (incoming):", logs);
                        fetchBalance(); // Refetch balance when tokens are received
                    },
                });
            } catch (err) {
                console.error("Error setting up event listeners:", err);
            }
        };

        setupEventListeners();

        // Cleanup function to properly unwatch both event listeners
        return () => {
            try {
                if (unwatchOutgoing) {
                    unwatchOutgoing();
                }
                if (unwatchIncoming) {
                    unwatchIncoming();
                }
            } catch (err) {
                console.error("Error cleaning up event listeners:", err);
            }
        };
    }, [address, publicClient, contractAddress, fetchBalance]);

    // Initial balance fetch
    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    return {
        balance,
        isLoading,
        error,
        refetch: fetchBalance,
    };
};

export default useBalance;