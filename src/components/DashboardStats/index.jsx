import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useProposals from "../../hooks/useProposals";
import useBalance from "../../hooks/useBalance";
import useChairPerson from "../../hooks/useChairPerson";
import { useAccount } from "wagmi";
import { isAddressEqual } from "viem";
import { useState, useEffect } from "react";

const DashboardStats = () => {
    const { proposals, proposalCount, isLoading } = useProposals();
    const { balance } = useBalance();
    const chairPerson = useChairPerson();
    const { address } = useAccount();
    const [hasError, setHasError] = useState(false);

    const isChairperson = address && chairPerson && isAddressEqual(address, chairPerson);
    
    // Safe data processing with error handling
    let activeProposals = [];
    let executedProposals = [];
    let totalVotes = 0;

    try {
        if (proposals && Array.isArray(proposals)) {
            activeProposals = proposals.filter(
                (proposal) => proposal && !proposal.executed && proposal.deadline * 1000 > Date.now()
            );
            
            executedProposals = proposals.filter(proposal => proposal && proposal.executed);
            
            totalVotes = proposals.reduce((sum, proposal) => {
                if (proposal && proposal.voteCount) {
                    // Convert BigInt to number safely for display
                    const voteCount = typeof proposal.voteCount === 'bigint' 
                        ? Number(proposal.voteCount) 
                        : Number(proposal.voteCount);
                    return sum + voteCount;
                }
                return sum;
            }, 0);
        }
    } catch (error) {
        console.error("Error processing proposal data:", error);
        setHasError(true);
    }

    // Error boundary effect
    useEffect(() => {
        const handleError = (error) => {
            console.error("DashboardStats error:", error);
            setHasError(true);
        };

        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    // If there's an error, show a simplified version
    if (hasError) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Dashboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-red-500">
                            Error loading dashboard data. Please refresh the page.
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Total Proposals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{proposalCount || 0}</div>
                    <p className="text-xs text-gray-500 mt-1">
                        Real-time count
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Active Proposals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                        {activeProposals.length || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Currently voting
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Total Votes Cast
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {totalVotes || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Across all proposals
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                        Your Governance Power
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                        {balance ? parseFloat(balance).toFixed(2) : "0.00"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        GOV tokens
                        {isChairperson && (
                            <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
                                Chairperson
                            </span>
                        )}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardStats;
