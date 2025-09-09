// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IEigenCompute
 * @notice Interface for EigenCloud's verifiable compute service
 */
interface IEigenCompute {
    struct ComputeRequest {
        string program;         // Program identifier (e.g., "portfolio_optimizer_v2")
        bytes inputs;          // Encoded input data
        bytes32 modelHash;     // Hash of the AI model to use
        uint256 minValidators; // Minimum number of validators required
        uint256 stakeRequired; // EIGEN stake required for computation
        uint256 timeout;       // Maximum execution time in seconds
        uint256 redundancy;    // Number of redundant executions
    }
    
    struct ComputeResult {
        uint256 taskId;
        bytes output;          // Computation output
        uint256 proof;         // Cryptographic proof of computation
        address[] validators;  // Validators who verified the computation
        uint256 gasUsed;      // Gas consumed for computation
        uint256 timestamp;    // Completion timestamp
    }
    
    event ComputationSubmitted(
        uint256 indexed taskId,
        string program,
        address indexed submitter
    );
    
    event ComputationCompleted(
        uint256 indexed taskId,
        bytes32 outputHash,
        uint256 validatorCount
    );
    
    /**
     * @notice Submit a computation request
     * @param request The computation request details
     * @return taskId Unique identifier for the computation task
     */
    function submitComputation(ComputeRequest calldata request) external returns (uint256 taskId);
    
    /**
     * @notice Get the result of a completed computation
     * @param taskId The computation task ID
     * @return result The computation result
     */
    function getResult(uint256 taskId) external view returns (ComputeResult memory result);
    
    /**
     * @notice Verify a computation proof
     * @param proof The proof to verify
     * @return valid Whether the proof is valid
     */
    function verifyProof(uint256 proof) external view returns (bool valid);
    
    /**
     * @notice Check if a computation is complete
     * @param taskId The computation task ID
     * @return complete Whether the computation is complete
     */
    function isComplete(uint256 taskId) external view returns (bool complete);
    
    /**
     * @notice Cancel a pending computation
     * @param taskId The computation task ID
     */
    function cancelComputation(uint256 taskId) external;
}