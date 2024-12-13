import { ContractInterface } from 'ethers';

// Import ABI JSON
import PortfolioValidationServiceManagerABI from '../../../eigenlayer-portfoliotask-avs/abis/PortfolioValidationServiceManager.json';

export const PortfolioValidationServiceManager: ContractInterface = PortfolioValidationServiceManagerABI.abi;

export type ValidationResult = {
    operator: string;
    assessment: string;
    confidence: number;
};

export type PortfolioAnalysis = {
    consensus: number;
    recommendations: string[];
    risk_score: number;
    validations: ValidationResult[];
}; 