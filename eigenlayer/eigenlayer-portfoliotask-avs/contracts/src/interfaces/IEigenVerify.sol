// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IEigenVerify
 * @notice Interface for EigenCloud's dispute resolution service
 */
interface IEigenVerify {
    struct DisputeRequest {
        uint256 taskId;         // Task being disputed
        address disputer;       // Address initiating the dispute
        bytes evidence;         // Evidence supporting the dispute
        uint256 slashingAmount; // Amount at stake for slashing
        address[] arbitratorSet; // Set of qualified arbitrators
        uint256 disputeType;    // Type of dispute (objective/subjective/performance)
        uint256 timeout;        // Time limit for resolution
    }
    
    struct DisputeResolution {
        uint256 disputeId;
        bool slashOperator;     // Whether to slash the operator
        uint256 slashAmount;    // Amount to slash
        bytes justification;    // Arbitrator's justification
        address[] arbitrators;  // Arbitrators who voted
        uint256 timestamp;      // Resolution timestamp
    }
    
    event DisputeInitiated(
        uint256 indexed disputeId,
        uint256 indexed taskId,
        address indexed disputer,
        uint256 disputeType
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        bool slashOperator,
        uint256 slashAmount
    );
    
    event ArbitratorVoted(
        uint256 indexed disputeId,
        address indexed arbitrator,
        bool voteToSlash
    );
    
    /**
     * @notice Initiate a dispute
     * @param request The dispute request details
     * @return disputeId Unique identifier for the dispute
     */
    function initiateDispute(DisputeRequest calldata request) external returns (uint256 disputeId);
    
    /**
     * @notice Get dispute resolution details
     * @param disputeId The dispute ID
     * @return resolution The dispute resolution
     */
    function getResolution(uint256 disputeId) external view returns (DisputeResolution memory resolution);
    
    /**
     * @notice Check if a dispute is resolved
     * @param disputeId The dispute ID
     * @return resolved Whether the dispute is resolved
     */
    function isResolved(uint256 disputeId) external view returns (bool resolved);
    
    /**
     * @notice Submit arbitrator vote
     * @param disputeId The dispute ID
     * @param voteToSlash Whether to vote for slashing
     * @param justification Reason for the vote
     */
    function submitArbitratorVote(
        uint256 disputeId,
        bool voteToSlash,
        bytes calldata justification
    ) external;
    
    /**
     * @notice Get arbitrator votes for a dispute
     * @param disputeId The dispute ID
     * @return votes Array of vote results
     */
    function getArbitratorVotes(uint256 disputeId) external view returns (bool[] memory votes);
}