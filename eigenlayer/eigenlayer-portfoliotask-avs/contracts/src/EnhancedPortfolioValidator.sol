// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PortfolioValidationServiceManager.sol";
import "./interfaces/IEigenVerify.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EnhancedPortfolioValidator
 * @notice Extends PortfolioValidationServiceManager with EigenVerify dispute resolution
 * @dev Enables subjective dispute resolution for portfolio decisions
 */
contract EnhancedPortfolioValidator is PortfolioValidationServiceManager, ReentrancyGuard {
    IEigenVerify public immutable eigenVerify;
    
    struct DisputeableTask {
        uint256 originalTaskId;
        bytes32 expectedOutcome;
        bytes32 actualOutcome;
        uint256 disputeWindow;
        uint256 slashingAmount;
        uint256 totalDisputes;
        DisputeStatus status;
    }
    
    struct DisputeInfo {
        address disputer;
        bytes evidence;
        uint256 timestamp;
        uint256 eigenVerifyId;
        bool resolved;
        bool slashed;
    }
    
    enum DisputeStatus {
        None,
        Open,
        UnderReview,
        Resolved
    }
    
    enum DisputeType {
        OBJECTIVE,   // Clear right/wrong based on data
        SUBJECTIVE,  // Requires judgment on strategy
        PERFORMANCE  // Based on outcome metrics
    }
    
    // State variables
    mapping(uint256 => DisputeableTask) public disputeableTasks;
    mapping(uint256 => mapping(address => DisputeInfo)) public disputes;
    mapping(uint256 => address[]) public taskDisputers;
    mapping(address => uint256) public operatorSlashings;
    
    uint256 public constant DISPUTE_WINDOW = 7 days;
    uint256 public constant MIN_DISPUTE_STAKE = 100 * 10**18; // 100 EIGEN
    uint256 public constant MAX_SLASHING_PERCENTAGE = 10; // 10% max slash
    
    // Events
    event DisputeWindowOpened(uint256 indexed taskId, uint256 closeTime);
    event DisputeInitiated(
        uint256 indexed taskId, 
        address indexed disputer, 
        uint256 disputeId,
        DisputeType disputeType
    );
    event DisputeResolved(
        uint256 indexed taskId, 
        uint256 indexed disputeId,
        bool slashed, 
        uint256 slashAmount
    );
    event OperatorSlashed(address indexed operator, uint256 amount, uint256 taskId);
    
    constructor(
        address _avsDirectory,
        address _registryCoordinator,
        address _stakeRegistry,
        address _eigenVerify
    ) PortfolioValidationServiceManager(
        _avsDirectory,
        _registryCoordinator,
        _stakeRegistry
    ) {
        eigenVerify = IEigenVerify(_eigenVerify);
    }
    
    /**
     * @notice Override createPortfolioTask to make it disputable
     */
    function createPortfolioTask(
        address[] memory tokens,
        uint256[] memory amounts,
        string memory strategy,
        ValidationStrategy validationType,
        bytes memory additionalData
    ) public override returns (uint256 taskId) {
        taskId = super.createPortfolioTask(tokens, amounts, strategy, validationType, additionalData);
        
        // Make task disputable
        disputeableTasks[taskId] = DisputeableTask({
            originalTaskId: taskId,
            expectedOutcome: bytes32(0), // To be set after validation
            actualOutcome: bytes32(0),   // To be set after execution
            disputeWindow: block.timestamp + DISPUTE_WINDOW,
            slashingAmount: MIN_DISPUTE_STAKE,
            totalDisputes: 0,
            status: DisputeStatus.Open
        });
        
        emit DisputeWindowOpened(taskId, block.timestamp + DISPUTE_WINDOW);
    }
    
    /**
     * @notice Initiate a dispute for a portfolio decision
     * @param taskId The task to dispute
     * @param evidence Supporting evidence for the dispute
     * @param disputeType Type of dispute (objective/subjective/performance)
     */
    function disputePortfolioDecision(
        uint256 taskId,
        bytes calldata evidence,
        DisputeType disputeType
    ) external payable nonReentrant {
        DisputeableTask storage task = disputeableTasks[taskId];
        require(task.status == DisputeStatus.Open, "Task not disputable");
        require(block.timestamp <= task.disputeWindow, "Dispute window closed");
        require(disputes[taskId][msg.sender].timestamp == 0, "Already disputed");
        require(msg.value >= MIN_DISPUTE_STAKE, "Insufficient stake");
        
        // Create dispute in EigenVerify
        uint256 eigenVerifyId = eigenVerify.initiateDispute(
            IEigenVerify.DisputeRequest({
                taskId: taskId,
                disputer: msg.sender,
                evidence: evidence,
                slashingAmount: task.slashingAmount,
                arbitratorSet: _getQualifiedArbitrators(disputeType),
                disputeType: uint256(disputeType),
                timeout: 3 days
            })
        );
        
        // Record dispute
        disputes[taskId][msg.sender] = DisputeInfo({
            disputer: msg.sender,
            evidence: evidence,
            timestamp: block.timestamp,
            eigenVerifyId: eigenVerifyId,
            resolved: false,
            slashed: false
        });
        
        taskDisputers[taskId].push(msg.sender);
        task.totalDisputes++;
        
        if (task.totalDisputes == 1) {
            task.status = DisputeStatus.UnderReview;
        }
        
        emit DisputeInitiated(taskId, msg.sender, eigenVerifyId, disputeType);
    }
    
    /**
     * @notice Callback from EigenVerify with dispute resolution
     * @param taskId The disputed task ID
     * @param disputer The address who initiated the dispute
     * @param slashOperator Whether to slash the operator
     * @param slashAmount Amount to slash if applicable
     */
    function resolveDispute(
        uint256 taskId,
        address disputer,
        bool slashOperator,
        uint256 slashAmount
    ) external {
        require(msg.sender == address(eigenVerify), "Only EigenVerify");
        
        DisputeInfo storage dispute = disputes[taskId][disputer];
        require(!dispute.resolved, "Already resolved");
        
        dispute.resolved = true;
        dispute.slashed = slashOperator;
        
        if (slashOperator) {
            _executeSlashing(taskId, slashAmount);
            // Refund disputer stake plus reward
            payable(disputer).transfer(MIN_DISPUTE_STAKE + (slashAmount / 10));
        } else {
            // Slash disputer's stake
            // Transfer to protocol treasury or burn
        }
        
        // Check if all disputes resolved
        _checkAllDisputesResolved(taskId);
        
        emit DisputeResolved(taskId, dispute.eigenVerifyId, slashOperator, slashAmount);
    }
    
    /**
     * @notice Execute slashing for a malicious operator
     * @param taskId The task that triggered slashing
     * @param slashAmount Amount to slash
     */
    function _executeSlashing(uint256 taskId, uint256 slashAmount) private {
        PortfolioTask memory task = portfolioTasks[taskId];
        
        // Get operators who validated this task
        address[] memory operators = _getTaskOperators(taskId);
        
        for (uint i = 0; i < operators.length; i++) {
            address operator = operators[i];
            
            // Calculate actual slash amount (capped at MAX_SLASHING_PERCENTAGE)
            uint256 operatorStake = stakeRegistry.getOperatorStake(operator);
            uint256 maxSlash = (operatorStake * MAX_SLASHING_PERCENTAGE) / 100;
            uint256 actualSlash = slashAmount > maxSlash ? maxSlash : slashAmount;
            
            // Execute slash through stake registry
            stakeRegistry.slashOperator(operator, actualSlash);
            operatorSlashings[operator] += actualSlash;
            
            emit OperatorSlashed(operator, actualSlash, taskId);
        }
    }
    
    /**
     * @notice Get qualified arbitrators based on dispute type
     * @param disputeType The type of dispute
     * @return arbitrators Array of qualified arbitrator addresses
     */
    function _getQualifiedArbitrators(
        DisputeType disputeType
    ) private view returns (address[] memory arbitrators) {
        // In production, this would query a registry of qualified arbitrators
        // For now, return a hardcoded set based on dispute type
        
        if (disputeType == DisputeType.OBJECTIVE) {
            // Return data verification specialists
            arbitrators = new address[](3);
            // Populate with addresses
        } else if (disputeType == DisputeType.SUBJECTIVE) {
            // Return strategy experts
            arbitrators = new address[](5);
            // Populate with addresses
        } else {
            // Return performance analysts
            arbitrators = new address[](3);
            // Populate with addresses
        }
        
        return arbitrators;
    }
    
    /**
     * @notice Get operators who validated a specific task
     * @param taskId The task ID
     * @return operators Array of operator addresses
     */
    function _getTaskOperators(uint256 taskId) private view returns (address[] memory) {
        // Query from task validations
        uint256 validationCount = taskValidationCounts[taskId];
        address[] memory operators = new address[](validationCount);
        
        // In production, this would fetch from taskValidations mapping
        // Simplified for demonstration
        return operators;
    }
    
    /**
     * @notice Check if all disputes for a task are resolved
     * @param taskId The task ID to check
     */
    function _checkAllDisputesResolved(uint256 taskId) private {
        DisputeableTask storage task = disputeableTasks[taskId];
        address[] memory disputers = taskDisputers[taskId];
        
        for (uint i = 0; i < disputers.length; i++) {
            if (!disputes[taskId][disputers[i]].resolved) {
                return; // Still pending disputes
            }
        }
        
        // All disputes resolved
        task.status = DisputeStatus.Resolved;
    }
    
    /**
     * @notice Get dispute information
     * @param taskId The task ID
     * @param disputer The disputer address
     * @return info The dispute information
     */
    function getDisputeInfo(
        uint256 taskId,
        address disputer
    ) external view returns (DisputeInfo memory) {
        return disputes[taskId][disputer];
    }
    
    /**
     * @notice Get all disputers for a task
     * @param taskId The task ID
     * @return disputers Array of disputer addresses
     */
    function getTaskDisputers(uint256 taskId) external view returns (address[] memory) {
        return taskDisputers[taskId];
    }
}