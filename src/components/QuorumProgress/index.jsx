import { Badge } from "../ui/badge";

const QuorumProgress = ({ currentVotes, quorumProgress }) => {
    if (!quorumProgress) return null;

    const { percentage, remaining, reached, threshold } = quorumProgress;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Quorum Progress</span>
                <Badge 
                    variant={reached ? "default" : "outline"} 
                    className={reached ? "bg-green-100 text-green-800" : ""}
                >
                    {percentage}%
                </Badge>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                        reached ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
                <span>{currentVotes} / {threshold} votes</span>
                {!reached && (
                    <span className="text-orange-600">
                        {remaining} more needed
                    </span>
                )}
                {reached && (
                    <span className="text-green-600 font-medium">
                        Quorum reached! ✓
                    </span>
                )}
            </div>
        </div>
    );
};

export default QuorumProgress;
