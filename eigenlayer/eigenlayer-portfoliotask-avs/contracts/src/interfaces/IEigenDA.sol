// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IEigenDA
 * @notice Interface for EigenCloud's data availability service
 */
interface IEigenDA {
    struct BlobRequest {
        bytes data;             // Data to store
        uint256 redundancy;     // Number of redundant copies
        uint256 expirationBlocks; // Blocks until expiration
        uint256 priority;       // Priority level (affects cost)
    }
    
    struct BlobMetadata {
        bytes32 blobId;        // Unique blob identifier
        bytes32 dataHash;      // Hash of the stored data
        uint256 size;          // Size in bytes
        uint256 timestamp;     // Storage timestamp
        uint256 expirationBlock; // When blob expires
        address storer;        // Who stored the blob
    }
    
    event BlobStored(
        bytes32 indexed blobId,
        address indexed storer,
        uint256 size,
        uint256 redundancy
    );
    
    event BlobRetrieved(
        bytes32 indexed blobId,
        address indexed retriever
    );
    
    event BlobExpired(
        bytes32 indexed blobId,
        uint256 expirationBlock
    );
    
    /**
     * @notice Store a data blob
     * @param request The blob storage request
     * @return blobId Unique identifier for the stored blob
     */
    function storeBlob(BlobRequest calldata request) external returns (bytes32 blobId);
    
    /**
     * @notice Retrieve a stored blob
     * @param blobId The blob identifier
     * @return data The stored data
     */
    function retrieveBlob(bytes32 blobId) external view returns (bytes memory data);
    
    /**
     * @notice Get blob metadata
     * @param blobId The blob identifier
     * @return metadata The blob metadata
     */
    function getBlobMetadata(bytes32 blobId) external view returns (BlobMetadata memory metadata);
    
    /**
     * @notice Check if a blob exists
     * @param blobId The blob identifier
     * @return exists Whether the blob exists
     */
    function blobExists(bytes32 blobId) external view returns (bool exists);
    
    /**
     * @notice Extend blob expiration
     * @param blobId The blob identifier
     * @param additionalBlocks Additional blocks before expiration
     */
    function extendExpiration(bytes32 blobId, uint256 additionalBlocks) external;
    
    /**
     * @notice Calculate storage cost
     * @param size Data size in bytes
     * @param redundancy Redundancy level
     * @param blocks Number of blocks to store
     * @return cost The storage cost in wei
     */
    function calculateStorageCost(
        uint256 size,
        uint256 redundancy,
        uint256 blocks
    ) external view returns (uint256 cost);
}