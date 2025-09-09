// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IEigenCompute.sol";
import "./PortfolioValidationServiceManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VerifiableAIOracle
 * @notice Integrates EigenCompute for verifiable AI portfolio recommendations
 * @dev This contract enables cryptographically proven AI inference for portfolio management
 */
contract VerifiableAIOracle is Ownable, ReentrancyGuard {
    IEigenCompute public immutable eigenCompute;
    PortfolioValidationServiceManager public immutable portfolioManager;
    
    struct AIInference {
        bytes32 modelHash;      // Hash of AI model used
        bytes32 inputHash;      // Hash of input data
        bytes32 outputHash;     // Hash of inference result
        uint256 computeProof;   // EigenCompute proof
        address[] validators;   // Nodes that verified computation
        uint256 timestamp;
        uint256 confidence;     // Confidence score 0-100
        InferenceStatus status;
    }
    
    struct PortfolioRecommendation {
        address[] tokens;
        uint256[] allocations; // Percentage allocations (basis points)
        uint256 riskScore;
        string strategy;
        bytes metadata;
    }
    
    enum InferenceStatus {
        Pending,
        Processing,
        Completed,
        Failed,
        Disputed
    }
    
    // State variables
    mapping(uint256 => AIInference) public inferences;
    mapping(uint256 => PortfolioRecommendation) public recommendations;
    mapping(address => uint256[]) public userInferences;
    mapping(bytes32 => bool) public verifiedModels;
    
    uint256 public inferenceCounter;
    uint256 public constant MIN_VALIDATORS = 3;
    uint256 public constant MIN_CONFIDENCE = 80;
    uint256 public constant COMPUTE_TIMEOUT = 300; // 5 minutes
    
    // Events
    event VerifiableInferenceRequested(
        uint256 indexed taskId, 
        address indexed requester,
        bytes32 modelHash
    );
    
    event VerifiableInferenceCompleted(
        uint256 indexed taskId, 
        bytes32 outputHash, 
        uint256 confidence
    );
    
    event RecommendationGenerated(
        uint256 indexed taskId,
        address indexed user,
        uint256 riskScore
    );
    
    event ModelRegistered(bytes32 indexed modelHash, string modelName);
    
    // Modifiers
    modifier onlyEigenCompute() {
        require(msg.sender == address(eigenCompute), "Only EigenCompute");
        _;
    }
    
    modifier onlyVerifiedModel(bytes32 modelHash) {
        require(verifiedModels[modelHash], "Model not verified");
        _;
    }
    
    constructor(
        address _eigenCompute,
        address _portfolioManager
    ) {
        eigenCompute = IEigenCompute(_eigenCompute);
        portfolioManager = PortfolioValidationServiceManager(_portfolioManager);
    }
    
    /**
     * @notice Request verifiable AI portfolio recommendation
     * @param tokens Array of token addresses
     * @param amounts Current token amounts
     * @param marketData Encoded market data for analysis
     * @param modelHash Hash of the AI model to use
     * @return taskId Unique identifier for this inference task
     */
    function requestPortfolioAnalysis(
        address[] memory tokens,
        uint256[] memory amounts,
        bytes calldata marketData,
        bytes32 modelHash
    ) external nonReentrant onlyVerifiedModel(modelHash) returns (uint256 taskId) {
        require(tokens.length == amounts.length, "Length mismatch");
        require(tokens.length > 0, "Empty portfolio");
        
        taskId = ++inferenceCounter;
        
        // Prepare input data
        bytes memory inputData = abi.encode(tokens, amounts, marketData);
        bytes32 inputHash = keccak256(inputData);
        
        // Submit to EigenCompute for verifiable execution
        uint256 computeTaskId = eigenCompute.submitComputation(
            IEigenCompute.ComputeRequest({
                program: "portfolio_optimizer_v2",
                inputs: inputData,
                modelHash: modelHash,
                minValidators: MIN_VALIDATORS,
                stakeRequired: 1000 * 10**18, // 1000 EIGEN
                timeout: COMPUTE_TIMEOUT,
                redundancy: 3
            })
        );
        
        // Store inference metadata
        inferences[taskId] = AIInference({
            modelHash: modelHash,
            inputHash: inputHash,
            outputHash: bytes32(0),
            computeProof: computeTaskId,
            validators: new address[](0),
            timestamp: block.timestamp,
            confidence: 0,
            status: InferenceStatus.Processing
        });
        
        userInferences[msg.sender].push(taskId);
        
        emit VerifiableInferenceRequested(taskId, msg.sender, modelHash);
    }
    
    /**
     * @notice Callback from EigenCompute with verified results
     * @param taskId The original task ID
     * @param outputData The computed portfolio recommendation
     * @param computeProof Cryptographic proof of computation
     * @param validators Array of validators who verified the computation
     */
    function receiveComputeResult(
        uint256 taskId,
        bytes calldata outputData,
        uint256 computeProof,
        address[] memory validators
    ) external onlyEigenCompute {
        AIInference storage inference = inferences[taskId];
        require(inference.status == InferenceStatus.Processing, "Invalid status");
        
        bytes32 outputHash = keccak256(outputData);
        uint256 confidence = _calculateConfidence(validators.length, computeProof);
        
        inference.outputHash = outputHash;
        inference.computeProof = computeProof;
        inference.validators = validators;
        inference.confidence = confidence;
        inference.status = InferenceStatus.Completed;
        
        // Decode and store recommendation
        PortfolioRecommendation memory recommendation = abi.decode(
            outputData,
            (PortfolioRecommendation)
        );
        recommendations[taskId] = recommendation;
        
        // If confidence is high enough, submit to portfolio validation
        if (confidence >= MIN_CONFIDENCE) {
            _submitForValidation(taskId, recommendation);
        }
        
        emit VerifiableInferenceCompleted(taskId, outputHash, confidence);
        emit RecommendationGenerated(taskId, msg.sender, recommendation.riskScore);
    }
    
    /**
     * @notice Register a new AI model for use in the system
     * @param modelHash Hash of the model
     * @param modelName Human-readable name
     * @param verificationProof Proof of model training/verification
     */
    function registerModel(
        bytes32 modelHash,
        string memory modelName,
        uint256 verificationProof
    ) external onlyOwner {
        require(!verifiedModels[modelHash], "Model already registered");
        require(eigenCompute.verifyProof(verificationProof), "Invalid proof");
        
        verifiedModels[modelHash] = true;
        emit ModelRegistered(modelHash, modelName);
    }
    
    /**
     * @notice Get inference details
     * @param taskId The task ID to query
     * @return inference The AIInference struct
     * @return recommendation The portfolio recommendation
     */
    function getInferenceDetails(uint256 taskId) 
        external 
        view 
        returns (AIInference memory inference, PortfolioRecommendation memory recommendation) 
    {
        inference = inferences[taskId];
        recommendation = recommendations[taskId];
    }
    
    /**
     * @notice Get all inferences for a user
     * @param user The user address
     * @return taskIds Array of task IDs
     */
    function getUserInferences(address user) external view returns (uint256[] memory) {
        return userInferences[user];
    }
    
    /**
     * @notice Calculate confidence score based on validators and proof
     * @param validatorCount Number of validators who verified
     * @param computeProof The computation proof
     * @return confidence Confidence score (0-100)
     */
    function _calculateConfidence(
        uint256 validatorCount,
        uint256 computeProof
    ) private pure returns (uint256) {
        // Base confidence from validator count
        uint256 baseConfidence = (validatorCount * 100) / MIN_VALIDATORS;
        if (baseConfidence > 100) baseConfidence = 100;
        
        // Additional confidence from proof quality (simplified)
        uint256 proofQuality = (computeProof % 20) + 80; // 80-99
        
        return (baseConfidence * proofQuality) / 100;
    }
    
    /**
     * @notice Submit recommendation for on-chain validation
     * @param taskId The task ID
     * @param recommendation The portfolio recommendation
     */
    function _submitForValidation(
        uint256 taskId,
        PortfolioRecommendation memory recommendation
    ) private {
        // Create validation task in PortfolioValidationServiceManager
        portfolioManager.createPortfolioTask(
            recommendation.tokens,
            recommendation.allocations,
            recommendation.strategy,
            PortfolioValidationServiceManager.ValidationStrategy.TokenEligibility,
            abi.encode(taskId, recommendation.metadata)
        );
    }
}