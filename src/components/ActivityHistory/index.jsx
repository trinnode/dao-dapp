import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QUADRATIC_GOVERNANCE_VOTING_CONTRACT_ABI } from "../../config/ABI";
import { formatVoteDisplay } from "../../lib/voteUtils";
import { shortenAddress } from "../../lib/utils";

const ActivityHistory = () => {
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState("all"); // all, proposals, votes
    const [selectedProposal, setSelectedProposal] = useState(null);
    const publicClient = usePublicClient();

    const contractAddress = import.meta.env.VITE_QUADRATIC_GOVERNANCE_VOTING_CONTRACT;

    // Fetch historical events
    const fetchActivities = useCallback(async () => {
        if (!publicClient || !contractAddress) return;

        setIsLoading(true);
        try {
            // Get the latest block number
            const latestBlock = await publicClient.getBlockNumber();
            
            // For free tier RPC: only use 10 block range maximum
            const maxBlockRange = 10n;
            const fromBlock = latestBlock - maxBlockRange;
            
            console.log(`Fetching events from block ${fromBlock} to ${latestBlock} (${maxBlockRange} blocks for free tier)`);

            // Fetch events with small range for free tier compatibility
            const proposalEvents = await publicClient.getLogs({
                address: contractAddress,
                event: {
                    type: "event",
                    name: "ProposalCreated",
                    inputs: [
                        { indexed: true, name: "proposalId", type: "uint256" },
                        { indexed: false, name: "proposer", type: "address" },
                        { indexed: false, name: "description", type: "string" },
                        { indexed: false, name: "recipient", type: "address" },
                        { indexed: false, name: "amount", type: "uint256" },
                        { indexed: false, name: "deadline", type: "uint256" },
                    ],
                },
                fromBlock,
                toBlock: 'latest',
            });

            const voteEvents = await publicClient.getLogs({
                address: contractAddress,
                event: {
                    type: "event",
                    name: "Voted",
                    inputs: [
                        { indexed: true, name: "proposalId", type: "uint256" },
                        { indexed: true, name: "voter", type: "address" },
                        { indexed: false, name: "support", type: "bool" },
                        { indexed: false, name: "votes", type: "uint256" },
                    ],
                },
                fromBlock,
                toBlock: 'latest',
            });

            console.log(`Found ${proposalEvents.length} proposal events and ${voteEvents.length} vote events in last ${maxBlockRange} blocks`);

            // Process and combine events
            const processedActivities = [];

            // Process proposal events
            for (const event of proposalEvents) {
                try {
                    const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
                    processedActivities.push({
                        id: `proposal-${event.args.proposalId}`,
                        type: "proposal",
                        proposalId: Number(event.args.proposalId),
                        proposer: event.args.proposer,
                        description: event.args.description,
                        recipient: event.args.recipient,
                        amount: event.args.amount,
                        deadline: event.args.deadline,
                        timestamp: Number(block.timestamp),
                        blockNumber: Number(event.blockNumber),
                        txHash: event.transactionHash,
                    });
                } catch (blockError) {
                    console.warn(`Error processing proposal event:`, blockError);
                }
            }

            // Process vote events
            for (const event of voteEvents) {
                try {
                    const block = await publicClient.getBlock({ blockNumber: event.blockNumber });
                    processedActivities.push({
                        id: `vote-${event.transactionHash}`,
                        type: "vote",
                        proposalId: Number(event.args.proposalId),
                        voter: event.args.voter,
                        support: event.args.support,
                        votes: event.args.votes,
                        timestamp: Number(block.timestamp),
                        blockNumber: Number(event.blockNumber),
                        txHash: event.transactionHash,
                    });
                } catch (blockError) {
                    console.warn(`Error processing vote event:`, blockError);
                }
            }

            // Sort by timestamp (most recent first)
            processedActivities.sort((a, b) => b.timestamp - a.timestamp);
            setActivities(processedActivities);

        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setIsLoading(false);
        }
    }, [publicClient, contractAddress]);

    useEffect(() => {
        fetchActivities();
        
        // Set up real-time listening for new events
        let unsubscribeProposal;
        let unsubscribeVote;

        if (publicClient && contractAddress) {
            // Listen for new proposal events
            unsubscribeProposal = publicClient.watchEvent({
                address: contractAddress,
                event: {
                    type: "event",
                    name: "ProposalCreated",
                    inputs: [
                        { indexed: true, name: "proposalId", type: "uint256" },
                        { indexed: false, name: "proposer", type: "address" },
                        { indexed: false, name: "description", type: "string" },
                        { indexed: false, name: "recipient", type: "address" },
                        { indexed: false, name: "amount", type: "uint256" },
                        { indexed: false, name: "deadline", type: "uint256" },
                    ],
                },
                onLogs: async (logs) => {
                    for (const log of logs) {
                        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                        const newActivity = {
                            id: `proposal-${log.args.proposalId}`,
                            type: "proposal",
                            proposalId: Number(log.args.proposalId),
                            proposer: log.args.proposer,
                            description: log.args.description,
                            recipient: log.args.recipient,
                            amount: log.args.amount,
                            deadline: log.args.deadline,
                            timestamp: Number(block.timestamp),
                            blockNumber: Number(log.blockNumber),
                            txHash: log.transactionHash,
                        };
                        
                        setActivities(prev => [newActivity, ...prev]);
                    }
                },
            });

            // Listen for new vote events
            unsubscribeVote = publicClient.watchEvent({
                address: contractAddress,
                event: {
                    type: "event",
                    name: "Voted",
                    inputs: [
                        { indexed: true, name: "proposalId", type: "uint256" },
                        { indexed: true, name: "voter", type: "address" },
                        { indexed: false, name: "support", type: "bool" },
                        { indexed: false, name: "votes", type: "uint256" },
                    ],
                },
                onLogs: async (logs) => {
                    for (const log of logs) {
                        const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                        const newActivity = {
                            id: `vote-${log.transactionHash}`,
                            type: "vote",
                            proposalId: Number(log.args.proposalId),
                            voter: log.args.voter,
                            support: log.args.support,
                            votes: log.args.votes,
                            timestamp: Number(block.timestamp),
                            blockNumber: Number(log.blockNumber),
                            txHash: log.transactionHash,
                        };
                        
                        setActivities(prev => [newActivity, ...prev]);
                    }
                },
            });
        }

        return () => {
            if (unsubscribeProposal) unsubscribeProposal();
            if (unsubscribeVote) unsubscribeVote();
        };
    }, [fetchActivities, publicClient, contractAddress]);

    // Filter activities based on selected filter and proposal
    const filteredActivities = activities.filter(activity => {
        if (selectedProposal && activity.proposalId !== selectedProposal) return false;
        if (filter === "proposals") return activity.type === "proposal";
        if (filter === "votes") return activity.type === "vote";
        return true;
    });

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    const ActivityItem = ({ activity }) => {
        if (activity.type === "proposal") {
            return (
                <Card className="mb-3">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                        Proposal #{activity.proposalId}
                                    </Badge>
                                    Created
                                </CardTitle>
                                <p className="text-xs text-gray-500 mt-1">
                                    by {shortenAddress(activity.proposer)} • {formatTimestamp(activity.timestamp)}
                                </p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedProposal(activity.proposalId)}
                                className="text-xs"
                            >
                                Filter by this
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-sm mb-2">{activity.description}</p>
                        <div className="text-xs text-gray-600 space-y-1">
                            <div>Recipient: {shortenAddress(activity.recipient)}</div>
                            <div>Amount: {(Number(activity.amount) / 1e18).toFixed(4)} ETH</div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (activity.type === "vote") {
            return (
                <Card className="mb-3">
                    <CardContent className="py-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    Vote
                                </Badge>
                                <div>
                                    <p className="text-sm font-medium">
                                        Proposal #{activity.proposalId} • {activity.support ? "YES" : "NO"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        by {shortenAddress(activity.voter)} • {formatVoteDisplay(activity.votes)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">
                                {formatTimestamp(activity.timestamp)}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return null;
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Blockchain Activity History</span>
                        <div className="flex gap-2">
                            {selectedProposal && (
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedProposal(null)}
                                >
                                    Clear Filter
                                </Button>
                            )}
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={fetchActivities}
                                disabled={isLoading}
                            >
                                {isLoading ? "Refreshing..." : "Refresh"}
                            </Button>
                        </div>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                        📡 Showing events from the last 10 blocks (free tier limitation). 
                        For full history, upgrade your RPC plan or check individual proposals.
                    </p>
                </CardHeader>
                <CardContent>
                    <Tabs value={filter} onValueChange={setFilter} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all">All Activity</TabsTrigger>
                            <TabsTrigger value="proposals">Proposals Only</TabsTrigger>
                            <TabsTrigger value="votes">Votes Only</TabsTrigger>
                        </TabsList>
                        
                        <div className="mt-4">
                            {selectedProposal && (
                                <Badge variant="secondary" className="mb-4">
                                    Showing activity for Proposal #{selectedProposal}
                                </Badge>
                            )}
                            
                            {isLoading ? (
                                <div className="text-center py-8">Loading activities...</div>
                            ) : filteredActivities.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No activities found for the selected filter.
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto">
                                    {filteredActivities.map(activity => (
                                        <ActivityItem key={activity.id} activity={activity} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default ActivityHistory;
