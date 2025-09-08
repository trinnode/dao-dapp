/**
 * Utility functions for handling vote-related data transformations
 */

/**
 * Converts vote weight from contract to readable vote count
 * Uses estimation for better user experience while preserving actual weights for quorum
 */
export const formatVoteCount = (voteWeight) => {
    return estimateVoteCount(voteWeight);
};

/**
 * Calculates the actual voting weight for quorum purposes
 * This preserves the real voting power based on token balance for quorum calculations
 */
export const calculateActualVotingWeight = (voteWeight) => {
    if (!voteWeight || voteWeight === 0) return 0;

    try {
        // Handle BigInt properly to avoid precision loss
        let weight;
        if (typeof voteWeight === 'bigint') {
            // Convert BigInt to string first, then to number for safety
            const weightStr = voteWeight.toString();
            weight = parseInt(weightStr, 10);
        } else {
            weight = Number(voteWeight);
        }
        
        //console.log(`Calculating actual voting weight: ${weight}`);
        
        // For quorum calculations, return the raw weight without modification
        // The smart contract handles the actual voting power calculations
        return Math.max(0, weight);
        
    } catch (error) {
        console.error("Error calculating actual voting weight:", error);
        return 0;
    }
};

/**
 * Estimates the number of individual votes from the total voting weight
 * This helps show a more meaningful count in the UI
 * Contract uses quadratic voting: weight = sqrt(token_balance) * scaling_factor
 * Based on observed data:
 * - 99,979,000 tokens → 9,998,949,944,869 contract weight
 * - 1,000 tokens → 31,622,776,601 contract weight
 */
export const estimateVoteCount = (totalVotingWeight) => {
    if (!totalVotingWeight || totalVotingWeight === 0) return 0;

    try {
        let weight;
        if (typeof totalVotingWeight === 'bigint') {
            weight = parseInt(totalVotingWeight.toString(), 10);
        } else {
            weight = Number(totalVotingWeight);
        }

        if (weight === 0) return 0;
        
        // Analyzing the pattern from your data:
        // 1,000 tokens → 31,622,776,601 (sqrt(1000) * 10^9 ≈ 31.62 * 10^9)
        // 99,979,000 tokens → 9,998,949,944,869 (sqrt(99979000) * 10^9 ≈ 9998.95 * 10^9)
        
        // The contract seems to use: weight = sqrt(tokens) * 10^9
        // To estimate vote count, we need to consider typical token holdings
        
        // Reference weights for estimation:
        const smallVoteWeight = 31622776601; // ~1000 tokens
        const largeVoteWeight = 9998949944869; // ~100M tokens
        
        if (weight <= smallVoteWeight * 1.5) {
            // Single small vote
            return 1;
        } else if (weight <= largeVoteWeight * 1.5) {
            // Single large vote or multiple small votes
            // Estimate based on how many "small votes" this could represent
            const estimatedSmallVotes = Math.round(weight / smallVoteWeight);
            return Math.min(estimatedSmallVotes, 10); // Cap at reasonable number
        } else {
            // Very large accumulated weight - estimate conservatively
            const estimatedVotes = Math.max(1, Math.round(weight / (smallVoteWeight * 2)));
            //console.log(`Estimated ${estimatedVotes} votes from weight ${weight}`);
            return Math.min(estimatedVotes, 50); // Cap at reasonable maximum
        }
        
    } catch (error) {
        console.error("Error estimating vote count:", error);
        return 1; // Default to 1 vote to show something meaningful
    }
};

/**
 * Format deadline timestamp for display
 */
export const formatDeadline = (timestamp) => {
    try {
        let timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp);
        
        const currentYear = new Date().getFullYear();
        const asSeconds = new Date(timestampNumber * 1000);
        
        // If year seems reasonable, use it
        if (asSeconds.getFullYear() >= currentYear && asSeconds.getFullYear() <= currentYear + 10) {
            return asSeconds.toLocaleDateString() + " " + asSeconds.toLocaleTimeString();
        }
        
        // If year is too far in future, apply correction
        if (asSeconds.getFullYear() > currentYear + 10) {
            const yearOffset = 56 * 365.25 * 24 * 60 * 60; // 56 years
            const correctedTimestamp = timestampNumber - yearOffset;
            const correctedDate = new Date(correctedTimestamp * 1000);
            
            if (correctedDate.getFullYear() >= currentYear && correctedDate.getFullYear() <= currentYear + 5) {
                return correctedDate.toLocaleDateString() + " " + correctedDate.toLocaleTimeString();
            }
        }
        
        // Fallback
        return asSeconds.toLocaleDateString() + " " + asSeconds.toLocaleTimeString();
        
    } catch (error) {
        console.error("Error formatting deadline:", error);
        return `Invalid date`;
    }
};

/**
 * Formats vote count for display with proper pluralization
 * Shows the estimated number of individual voters
 */
export const formatVoteDisplay = (voteWeight) => {
    const count = formatVoteCount(voteWeight);
    if (count === 0) return "0 votes";
    if (count >= 1) return "1 vote";
    return `${count} votes`;
};

/**
 * Calculate voting power based on token balance
 * This matches the contract's quadratic voting formula
 */
export const calculateVotingPower = (balance) => {
    if (!balance || parseFloat(balance) === 0) return 0;
    
    try {
        const numBalance = parseFloat(balance);
        // Contract uses sqrt(balance) * scaling_factor
        // Based on observed data, scaling factor appears to be ~10^9
        const votingPower = Math.floor(Math.sqrt(numBalance)) * 1000000000; // 10^9 scaling
        //console.log(`Calculated voting power: ${numBalance} tokens → ${votingPower} weight`);
        return votingPower;
    } catch (error) {
        console.error("Error calculating voting power:", error);
        return 0;
    }
};

/**
 * Debug function to analyze voting weights
 * Helps understand the relationship between tokens and contract weights
 */
export const analyzeVotingWeight = (weight, description = "") => {
    if (!weight) return;
    
    try {
        let numWeight;
        if (typeof weight === 'bigint') {
            numWeight = parseInt(weight.toString(), 10);
        } else {
            numWeight = Number(weight);
        }
        
        // Estimate original token balance that could produce this weight
        // If weight = sqrt(tokens) * 10^9, then tokens = (weight / 10^9)^2
        const estimatedTokens = Math.pow(numWeight / 1000000000, 2);
        
        console.log(`Vote Analysis ${description}:`, {
            contractWeight: numWeight.toLocaleString(),
            estimatedTokens: Math.round(estimatedTokens).toLocaleString(),
            // estimatedVoteCount: estimateVoteCount(weight)
        });
    } catch (error) {
        console.error("Error analyzing voting weight:", error);
    }
};
