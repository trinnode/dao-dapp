import { useState } from "react";
import { usePublicClient } from "wagmi";
import { QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI } from "../../config/ABI";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

const DebugData = () => {
    const [debugInfo, setDebugInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const publicClient = usePublicClient();
    const contractAddress = import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT;

    const fetchDebugInfo = async () => {
        if (!publicClient || !contractAddress) return;
        
        setIsLoading(true);
        try {
            // Get proposal count
            const count = await publicClient.readContract({
                address: contractAddress,
                abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                functionName: "getProposalCount",
            });

            const debugData = {
                proposalCount: Number(count),
                proposals: []
            };

            // Get first few proposals for debugging
            const maxProposals = Math.min(Number(count), 3);
            for (let i = 0; i < maxProposals; i++) {
                const proposal = await publicClient.readContract({
                    address: contractAddress,
                    abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                    functionName: "proposals",
                    args: [i],
                });

                debugData.proposals.push({
                    id: i,
                    raw: proposal,
                    description: proposal[0],
                    recipient: proposal[1],
                    amount: proposal[2]?.toString(),
                    voteCount: proposal[3]?.toString(),
                    deadline: proposal[4]?.toString(),
                    executed: proposal[5],
                    deadlineAsDate: new Date(Number(proposal[4]) * 1000).toISOString(),
                    deadlineAsDateMs: new Date(Number(proposal[4])).toISOString(),
                });
            }

            // Get quorum
            try {
                const quorum = await publicClient.readContract({
                    address: contractAddress,
                    abi: QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI,
                    functionName: "quorum",
                });
                debugData.quorum = quorum?.toString();
            } catch (err) {
                debugData.quorumError = err.message;
            }

            setDebugInfo(debugData);
            //console.log("Debug data:", debugData);
            
        } catch (error) {
            console.error("Debug fetch error:", error);
            setDebugInfo({ error: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Debug Contract Data</span>
                    <Button 
                        onClick={fetchDebugInfo}
                        disabled={isLoading}
                        size="sm"
                    >
                        {isLoading ? "Fetching..." : "Fetch Debug Data"}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {debugInfo && (
                    <div className="space-y-4">
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Contract Info</h3>
                            <p>Proposal Count: {debugInfo.proposalCount}</p>
                            <p>Quorum: {debugInfo.quorum || "Error: " + debugInfo.quorumError}</p>
                        </div>
                        
                        {debugInfo.proposals?.map((proposal, index) => (
                            <div key={index} className="bg-gray-100 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Proposal #{proposal.id}</h3>
                                <div className="text-sm space-y-1">
                                    <p><strong>Description:</strong> {proposal.description}</p>
                                    <p><strong>Recipient:</strong> {proposal.recipient}</p>
                                    <p><strong>Amount:</strong> {proposal.amount} wei ({(Number(proposal.amount) / 1e18).toFixed(4)} ETH)</p>
                                    <p><strong>Vote Count (raw):</strong> {proposal.voteCount}</p>
                                    <p><strong>Vote Count (√):</strong> {Math.round(Math.sqrt(Number(proposal.voteCount)))}</p>
                                    <p><strong>Vote Count (√√):</strong> {Math.round(Math.sqrt(Math.sqrt(Number(proposal.voteCount))))}</p>
                                    <p><strong>Vote Count (/1e9):</strong> {(Number(proposal.voteCount) / 1e9).toFixed(2)}</p>
                                    <p><strong>Deadline (raw):</strong> {proposal.deadline}</p>
                                    <p><strong>Deadline as date (seconds):</strong> {proposal.deadlineAsDate}</p>
                                    <p><strong>Deadline corrected (-56 years):</strong> {new Date((Number(proposal.deadline) - (56 * 365.25 * 24 * 60 * 60)) * 1000).toISOString()}</p>
                                    <p><strong>Executed:</strong> {proposal.executed ? "Yes" : "No"}</p>
                                </div>
                            </div>
                        ))}
                        
                        {debugInfo.error && (
                            <div className="bg-red-100 p-4 rounded-lg text-red-800">
                                <h3 className="font-semibold mb-2">Error</h3>
                                <p>{debugInfo.error}</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DebugData;
