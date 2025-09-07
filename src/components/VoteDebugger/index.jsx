import { useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI } from "../../config/ABI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const VoteDebugger = () => {
    const [debugData, setDebugData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const publicClient = usePublicClient();
    
    const contractAddress = import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT;

    const debugVoteCounts = useCallback(async () => {
        if (!publicClient || !contractAddress) return;

        setIsLoading(true);
        try {
            // Get proposal count
            const count = await publicClient.readContract({
                address: contractAddress,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                functionName: "getProposalCount",
            });

            console.log("Proposal count:", count);

            const proposalData = [];
            for (let i = 0; i < Number(count); i++) {
                try {
                    const proposal = await publicClient.readContract({
                        address: contractAddress,
                        abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                        functionName: "proposals",
                        args: [i],
                    });

                    proposalData.push({
                        id: i,
                        description: proposal[0],
                        recipient: proposal[1],
                        amount: proposal[2].toString(),
                        rawVoteCount: proposal[3].toString(),
                        rawVoteCountBigInt: proposal[3],
                        deadline: proposal[4].toString(),
                        executed: proposal[5],
                    });
                } catch (error) {
                    console.error(`Error fetching proposal ${i}:`, error);
                }
            }

            setDebugData({
                proposalCount: Number(count),
                proposals: proposalData,
                timestamp: new Date().toISOString(),
            });

        } catch (error) {
            console.error("Debug error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [publicClient, contractAddress]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Vote Count Debugger
                    <Button 
                        onClick={debugVoteCounts} 
                        disabled={isLoading}
                        size="sm"
                    >
                        {isLoading ? "Loading..." : "Debug Vote Counts"}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {debugData && (
                    <div className="space-y-4">
                        <div className="text-sm">
                            <strong>Debug Time:</strong> {new Date(debugData.timestamp).toLocaleString()}
                        </div>
                        <div className="text-sm">
                            <strong>Total Proposals:</strong> {debugData.proposalCount}
                        </div>
                        
                        {debugData.proposals.map((proposal) => (
                            <div key={proposal.id} className="border p-3 rounded bg-gray-50">
                                <div className="font-bold">Proposal #{proposal.id}</div>
                                <div className="text-sm space-y-1">
                                    <div><strong>Description:</strong> {proposal.description}</div>
                                    <div><strong>Raw Vote Count:</strong> {proposal.rawVoteCount}</div>
                                    <div><strong>Vote Count (BigInt):</strong> {proposal.rawVoteCountBigInt.toString()}</div>
                                    <div><strong>Amount:</strong> {proposal.amount} wei</div>
                                    <div><strong>Executed:</strong> {proposal.executed ? "Yes" : "No"}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {!debugData && !isLoading && (
                    <div className="text-gray-500 text-center py-4">
                        Click "Debug Vote Counts" to see raw contract data
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default VoteDebugger;
