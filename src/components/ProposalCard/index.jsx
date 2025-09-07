import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "../../lib/utils";
import { formatUnits } from "viem";
import { formatDeadline } from "../../lib/voteUtils";
import QuorumProgress from "../QuorumProgress";

const ProposalCard = ({
    id,
    description,
    recipient,
    amount,
    voteCount,
    deadline,
    executed,
    handleVote,
    canVote = true,
    hasVoted = false, // New prop to track if user has voted
    quorumProgress = null, // Quorum progress data
}) => {
    const isExpired = deadline * 1000 < Date.now();
    const canUserVote = canVote && !executed && !isExpired;
    
    const formatAmount = (amountWei) => {
        try {
            return `${parseFloat(formatUnits(BigInt(amountWei), 18)).toFixed(2)} ETH`;
        } catch {
            return `${amountWei} wei`;
        }
    };

    const handleVoteToggle = () => {
        if (handleVote) {
            handleVote(id);
        }
    };

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <CardTitle className="flex justify-between items-center text-sm">
                    <span>Proposal #{id}</span>
                    <div className="flex flex-col items-end">
                        <span className="text-blue-600">Votes: {voteCount}</span>
                        {hasVoted && <span className="text-green-600 text-xs">You voted</span>}
                        {executed && <span className="text-green-600 text-xs">Executed</span>}
                        {isExpired && !executed && <span className="text-red-600 text-xs">Expired</span>}
                    </div>
                </CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="font-medium">Recipient:</span>
                    <span className="text-gray-600">{shortenAddress(recipient, 4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="font-medium">Amount:</span>
                    <span className="text-gray-600">{formatAmount(amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="font-medium">Deadline:</span>
                    <span className="text-gray-600">{formatDeadline(deadline)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="font-medium">Status:</span>
                    <span className={`${executed ? 'text-green-600' : isExpired ? 'text-red-600' : 'text-blue-600'}`}>
                        {executed ? 'Executed' : isExpired ? 'Expired' : 'Active'}
                    </span>
                </div>
                
                {/* Quorum Progress */}
                {quorumProgress && !executed && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <QuorumProgress currentVotes={voteCount} quorumProgress={quorumProgress} />
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-2">
                {canUserVote ? (
                    <Button
                        onClick={handleVoteToggle}
                        className={`w-full ${hasVoted 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        size="sm"
                    >
                        {hasVoted ? 'Withdraw Vote' : 'Cast Vote'}
                    </Button>
                ) : (
                    <Button
                        disabled
                        className="w-full"
                        size="sm"
                    >
                        {executed ? 'Executed' : isExpired ? 'Expired' : !canVote ? 'No Voting Power' : 'Cannot Vote'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default ProposalCard;
