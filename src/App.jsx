import AppLayout from "./components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProposalCard from "./components/ProposalCard";
import DashboardStats from "./components/DashboardStats";
import ActivityHistory from "./components/ActivityHistory";
import DebugData from "./components/DebugData";
import useChairPerson from "./hooks/useChairPerson";
import useProposals from "./hooks/useProposals";
import useVoting from "./hooks/useVoting";
import useQuorum from "./hooks/useQuorum";
import useRealtimeNotifications from "./hooks/useRealtimeNotifications";
import { calculateActualVotingWeight } from "./lib/voteUtils";
import { toast } from "sonner";
import { useEffect } from "react";

function App() {
    const chairPerson = useChairPerson();
    const { proposals, isLoading, error, updateSpecificProposals } = useProposals();
    const { vote, canVote, updateVoteStatuses, getUserVoteStatus } = useVoting();
    const { /*quorumThreshold,*/ getQuorumProgress } = useQuorum();
    
    // Enable real-time notifications
    useRealtimeNotifications();
    
    // Update vote statuses when proposals change
    useEffect(() => {
        if (proposals.length > 0) {
            const proposalIds = proposals.map(p => p.id);
            updateVoteStatuses(proposalIds);
        }
    }, [proposals, updateVoteStatuses]);

    // Handle vote with immediate refresh
    const handleVote = async (proposalId) => {
        try {
            await vote(proposalId);
            // Wait for transaction confirmation, then refresh the specific proposal
            // Using a proper promise chain instead of setTimeout
            updateSpecificProposals([proposalId]);
        } catch (error) {
            console.error("Error in handleVote:", error);
            // Show user-friendly error message
            toast.error("Failed to process vote", {
                description: "Please try again or check your connection"
            });
        }
    };

    // Filter proposals based on their status and deadline
    const activePropsals = proposals.filter(
        (proposal) => !proposal.executed && proposal.deadline * 1000 > Date.now()
    );
    
    const inActiveProposals = proposals.filter(
        (proposal) => proposal.executed || proposal.deadline * 1000 < Date.now()
    );

    if (isLoading) {
        return (
            <AppLayout chairPersonAddress={chairPerson}>
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading proposals...</div>
                </div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout chairPersonAddress={chairPerson}>
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="text-lg text-red-500 mb-2">
                            Connection Error
                        </div>
                        <div className="text-sm text-gray-500">
                            Unable to connect to the blockchain. Please check your connection and refresh.
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }
    return (
        <AppLayout chairPersonAddress={chairPerson}>
            <div className="flex w-full flex-col gap-4 sm:gap-6">
                {/* Only show DashboardStats if not loading and no error */}
                {!isLoading && !error && <DashboardStats />}
                <Tabs defaultValue="active" className="mt-2 sm:mt-4">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
                        <TabsTrigger value="active" className="cursor-pointer text-sm sm:text-base">
                            Active
                        </TabsTrigger>
                        <TabsTrigger
                            value="inactive"
                            className="cursor-pointer text-sm sm:text-base"
                        >
                            Inactive
                        </TabsTrigger>
                        {/*<TabsTrigger
                            value="activity"
                            className="cursor-pointer"
                        >
                            Activity
                        </TabsTrigger>
                        <TabsTrigger
                            value="debug"
                            className="cursor-pointer"
                        >
                            Debug
                        </TabsTrigger> */}
                    </TabsList>
                    <TabsContent value="active">
                        {activePropsals.length === 0 ? (
                            <div className="text-center py-6 sm:py-8">
                                <span className="text-base sm:text-lg text-gray-600">No active proposals</span>
                                <p className="text-xs sm:text-sm text-gray-400 mt-2 px-4">
                                    {proposals.length === 0 
                                        ? "Create the first proposal to get started!" 
                                        : "All proposals have expired or been executed"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mx-auto">
                                {activePropsals.map((proposal) => (
                                    <ProposalCard
                                        key={proposal.id}
                                        id={proposal.id}
                                        description={proposal.description}
                                        recipient={proposal.recipient}
                                        amount={proposal.amount.toString()}
                                        voteCount={proposal.voteCount}
                                        // deadline={Number(proposal.deadline)}
                                        deadline={Math.floor(proposal.deadline.valueOf() - Date.now() / 1000)}
                                        executed={proposal.executed}
                                        handleVote={handleVote}
                                        canVote={canVote}
                                        hasVoted={getUserVoteStatus(proposal.id)}
                                        quorumProgress={getQuorumProgress(calculateActualVotingWeight(proposal.rawVoteCount))}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="inactive">
                        {inActiveProposals.length === 0 ? (
                            <div className="text-center py-6 sm:py-8">
                                <span className="text-base sm:text-lg text-gray-600">No inactive proposals</span>
                                <p className="text-xs sm:text-sm text-gray-400 mt-2 px-4">
                                    Executed and expired proposals will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mx-auto">
                                {inActiveProposals.map((proposal) => (
                                    <ProposalCard
                                        key={proposal.id}
                                        id={proposal.id}
                                        description={proposal.description}
                                        recipient={proposal.recipient}
                                        amount={proposal.amount.toString()}
                                        voteCount={proposal.voteCount}
                                        deadline={Math.floor(proposal.deadline.valueOf() - Date.now() / 1000)}
                                        executed={proposal.executed}
                                        handleVote={() => {}} // Disabled for inactive proposals
                                        canVote={false}
                                        hasVoted={getUserVoteStatus(proposal.id)}
                                        quorumProgress={getQuorumProgress(calculateActualVotingWeight(proposal.rawVoteCount))}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    
                     <TabsContent value="activity">
                        <ActivityHistory />
                    </TabsContent> 
                    <TabsContent value="debug">
                        <DebugData />
                    </TabsContent> */}
                </Tabs>
            </div>
        </AppLayout>
    );
}

export default App;
