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
        <Card className="w-full mx-auto shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
                    <span className="font-bold text-base sm:text-sm">Proposal #{id}</span>
                    <div className="flex flex-col items-start sm:items-end gap-1">
                        <span className="text-blue-600 font-semibold">Votes: {voteCount}</span>
                        <div className="flex gap-2 text-xs">
                            {hasVoted && <span className="text-green-600 bg-green-100 px-2 py-1 rounded">You voted</span>}
                            {executed && <span className="text-green-600 bg-green-100 px-2 py-1 rounded">Executed</span>}
                            {isExpired && !executed && <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Expired</span>}
                        </div>
                    </div>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
                <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">Recipient:</span>
                        <span className="text-gray-600 font-mono break-all sm:break-normal">
                            <span className="sm:hidden">{shortenAddress(recipient, 6)}</span>
                            <span className="hidden sm:inline">{shortenAddress(recipient, 4)}</span>
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">Amount:</span>
                        <span className="text-gray-600 font-semibold">{formatAmount(amount)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">Deadline:</span>
                        <span className="text-gray-600">{formatDeadline(deadline)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">Status:</span>
                        <span className={`font-semibold ${executed ? 'text-green-600' : isExpired ? 'text-red-600' : 'text-blue-600'}`}>
                            {executed ? 'Executed' : isExpired ? 'Expired' : 'Active'}
                        </span>
                    </div>
                </div>
                
                {/* Quorum Progress */}
                {quorumProgress && !executed && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <QuorumProgress currentVotes={voteCount} quorumProgress={quorumProgress} />
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-3">
                {canUserVote ? (
                    <Button
                        onClick={hasVoted ? undefined : handleVoteToggle}
                        disabled={hasVoted}
                        className={`w-full text-sm sm:text-base ${hasVoted 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        size="sm"
                    >
                        {hasVoted ? 'VOTED' : 'Cast Vote'}
                    </Button>
                ) : (
                    <Button
                        disabled
                        className="w-full text-sm sm:text-base"
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
