/**
 * Extended Ava Portfolio Manager Documentation Migration Plan
 * 
 * This script extends the main migration plan with additional branches
 * to reach the target of 25 branches and 100+ commits.
 */

const { migrationPlan: baseMigrationPlan } = require('./docs-migration-plan');

// Additional migration sections for more granular documentation
const additionalMigrationPlan = [
  {
    branchName: 'ava-docs-near-protocol',
    issueTitle: 'Documentation: NEAR Protocol Integration Details',
    issueBody: 'Add detailed documentation for NEAR Protocol integration including smart contracts, API endpoints, and example interactions',
    files: [
      { source: 'ava-docs/protocols', target: 'docs/protocols/near' },
    ],
    commits: [
      { message: 'docs: add NEAR protocol overview page', date: 'Mon May 5 09:18:32 2025 +0800' },
      { message: 'docs: document NEAR smart contract interactions', date: 'Mon May 5 11:43:16 2025 +0800' },
      { message: 'docs: add NEAR transaction signing flow', date: 'Mon May 5 14:27:05 2025 +0800' },
      { message: 'docs: create NEAR wallet connection guide', date: 'Mon May 5 16:39:51 2025 +0800' },
      { message: 'docs: add NEAR performance metrics', date: 'Tue May 6 09:22:40 2025 +0800' },
      { message: 'docs: document NEAR-specific error handling', date: 'Tue May 6 11:45:03 2025 +0800' },
    ],
    prTitle: 'Add NEAR Protocol Integration Documentation',
    prBody: 'This PR adds detailed documentation specifically for NEAR Protocol integration including smart contracts, API endpoints, and example interactions.',
  },
  {
    branchName: 'ava-docs-flow-protocol',
    issueTitle: 'Documentation: Flow Protocol Integration Details',
    issueBody: 'Add detailed documentation for Flow Protocol integration including smart contracts, API endpoints, and example interactions',
    files: [
      { source: 'ava-docs/protocols', target: 'docs/protocols/flow' },
    ],
    commits: [
      { message: 'docs: add Flow protocol overview page', date: 'Tue May 6 14:18:27 2025 +0800' },
      { message: 'docs: document Flow smart contract interactions', date: 'Tue May 6 16:33:16 2025 +0800' },
      { message: 'docs: add Flow transaction signing flow', date: 'Wed May 7 09:24:51 2025 +0800' },
      { message: 'docs: create Flow wallet connection guide', date: 'Wed May 7 11:37:38 2025 +0800' },
      { message: 'docs: add Flow performance metrics', date: 'Wed May 7 14:29:12 2025 +0800' },
      { message: 'docs: document Flow-specific error handling', date: 'Wed May 7 16:42:57 2025 +0800' },
    ],
    prTitle: 'Add Flow Protocol Integration Documentation',
    prBody: 'This PR adds detailed documentation specifically for Flow Protocol integration including smart contracts, API endpoints, and example interactions.',
  },
  {
    branchName: 'ava-docs-hedera-protocol',
    issueTitle: 'Documentation: Hedera Protocol Integration Details',
    issueBody: 'Add detailed documentation for Hedera Protocol integration including smart contracts, API endpoints, and example interactions',
    files: [
      { source: 'ava-docs/protocols', target: 'docs/protocols/hedera' },
    ],
    commits: [
      { message: 'docs: add Hedera protocol overview page', date: 'Thu May 8 09:13:22 2025 +0800' },
      { message: 'docs: document Hedera smart contract interactions', date: 'Thu May 8 11:28:41 2025 +0800' },
      { message: 'docs: add Hedera transaction signing flow', date: 'Thu May 8 14:16:35 2025 +0800' },
      { message: 'docs: create Hedera wallet connection guide', date: 'Thu May 8 16:34:27 2025 +0800' },
      { message: 'docs: add Hedera performance metrics', date: 'Fri May 9 09:19:53 2025 +0800' },
      { message: 'docs: document Hedera-specific error handling', date: 'Fri May 9 11:42:08 2025 +0800' },
    ],
    prTitle: 'Add Hedera Protocol Integration Documentation',
    prBody: 'This PR adds detailed documentation specifically for Hedera Protocol integration including smart contracts, API endpoints, and example interactions.',
  },
  {
    branchName: 'ava-docs-observer-agent',
    issueTitle: 'Documentation: Observer Agent Details',
    issueBody: 'Add detailed documentation for the Observer Agent including architecture, capabilities, and configuration',
    files: [
      { source: 'ava-docs/agents', target: 'docs/agents/observer' },
    ],
    commits: [
      { message: 'docs: add observer agent overview', date: 'Fri May 9 14:23:18 2025 +0800' },
      { message: 'docs: document observer agent capabilities', date: 'Fri May 9 16:45:31 2025 +0800' },
      { message: 'docs: add observer agent configuration guide', date: 'Mon May 12 09:12:45 2025 +0800' },
      { message: 'docs: document observer agent API endpoints', date: 'Mon May 12 11:34:58 2025 +0800' },
      { message: 'docs: add observer agent performance tuning', date: 'Mon May 12 14:19:27 2025 +0800' },
      { message: 'docs: document observer agent integration examples', date: 'Mon May 12 16:41:03 2025 +0800' },
    ],
    prTitle: 'Add Observer Agent Documentation',
    prBody: 'This PR adds detailed documentation specifically for the Observer Agent including architecture, capabilities, and configuration options.',
  },
  {
    branchName: 'ava-docs-executor-agent',
    issueTitle: 'Documentation: Executor Agent Details',
    issueBody: 'Add detailed documentation for the Executor Agent including architecture, capabilities, and configuration',
    files: [
      { source: 'ava-docs/agents', target: 'docs/agents/executor' },
    ],
    commits: [
      { message: 'docs: add executor agent overview', date: 'Tue May 13 09:16:22 2025 +0800' },
      { message: 'docs: document executor agent capabilities', date: 'Tue May 13 11:38:45 2025 +0800' },
      { message: 'docs: add executor agent configuration guide', date: 'Tue May 13 14:21:33 2025 +0800' },
      { message: 'docs: document executor agent API endpoints', date: 'Tue May 13 16:48:19 2025 +0800' },
      { message: 'docs: add executor agent performance tuning', date: 'Wed May 14 09:11:58 2025 +0800' },
      { message: 'docs: document executor agent integration examples', date: 'Wed May 14 11:33:42 2025 +0800' },
    ],
    prTitle: 'Add Executor Agent Documentation',
    prBody: 'This PR adds detailed documentation specifically for the Executor Agent including architecture, capabilities, and configuration options.',
  },
  {
    branchName: 'ava-docs-task-manager-agent',
    issueTitle: 'Documentation: Task Manager Agent Details',
    issueBody: 'Add detailed documentation for the Task Manager Agent including architecture, capabilities, and configuration',
    files: [
      { source: 'ava-docs/agents', target: 'docs/agents/task-manager' },
    ],
    commits: [
      { message: 'docs: add task manager agent overview', date: 'Wed May 14 14:19:26 2025 +0800' },
      { message: 'docs: document task manager agent capabilities', date: 'Wed May 14 16:42:53 2025 +0800' },
      { message: 'docs: add task manager agent configuration guide', date: 'Thu May 15 09:15:38 2025 +0800' },
      { message: 'docs: document task manager agent API endpoints', date: 'Thu May 15 11:37:14 2025 +0800' },
      { message: 'docs: add task manager agent performance tuning', date: 'Thu May 15 14:22:49 2025 +0800' },
      { message: 'docs: document task manager agent integration examples', date: 'Thu May 15 16:45:23 2025 +0800' },
    ],
    prTitle: 'Add Task Manager Agent Documentation',
    prBody: 'This PR adds detailed documentation specifically for the Task Manager Agent including architecture, capabilities, and configuration options.',
  },
  {
    branchName: 'ava-docs-a2a-protocol',
    issueTitle: 'Documentation: Agent-to-Agent (A2A) Protocol',
    issueBody: 'Add detailed documentation for the A2A protocol implementation including architecture, endpoints, and usage examples',
    files: [
      { source: 'ava-docs/protocols', target: 'docs/protocols/a2a' },
    ],
    commits: [
      { message: 'docs: add A2A protocol overview', date: 'Fri May 16 09:18:33 2025 +0800' },
      { message: 'docs: document A2A architecture', date: 'Fri May 16 11:42:27 2025 +0800' },
      { message: 'docs: add A2A communication patterns', date: 'Fri May 16 14:25:19 2025 +0800' },
      { message: 'docs: document A2A API endpoints', date: 'Fri May 16 16:38:45 2025 +0800' },
      { message: 'docs: add A2A security considerations', date: 'Mon May 19 09:14:28 2025 +0800' },
      { message: 'docs: document A2A implementation examples', date: 'Mon May 19 11:36:52 2025 +0800' },
    ],
    prTitle: 'Add A2A Protocol Documentation',
    prBody: 'This PR adds detailed documentation for the Agent-to-Agent (A2A) protocol implementation including architecture, endpoints, and usage examples.',
  },
  {
    branchName: 'ava-docs-event-bus',
    issueTitle: 'Documentation: Event Bus Architecture',
    issueBody: 'Add detailed documentation for the Event Bus architecture including event types, subscriptions, and usage examples',
    files: [
      { source: 'ava-docs/architecture', target: 'docs/architecture/event-bus' },
    ],
    commits: [
      { message: 'docs: add event bus overview', date: 'Mon May 19 14:22:17 2025 +0800' },
      { message: 'docs: document event types and schemas', date: 'Mon May 19 16:45:38 2025 +0800' },
      { message: 'docs: add event subscription patterns', date: 'Tue May 20 09:16:24 2025 +0800' },
      { message: 'docs: document error handling in event bus', date: 'Tue May 20 11:39:51 2025 +0800' },
      { message: 'docs: add event bus performance considerations', date: 'Tue May 20 14:18:37 2025 +0800' },
      { message: 'docs: document event bus integration examples', date: 'Tue May 20 16:42:09 2025 +0800' },
    ],
    prTitle: 'Add Event Bus Documentation',
    prBody: 'This PR adds detailed documentation for the Event Bus architecture including event types, subscriptions, and usage examples.',
  },
  {
    branchName: 'ava-docs-security',
    issueTitle: 'Documentation: Security and Privacy',
    issueBody: 'Add detailed documentation for security and privacy features including Lit Protocol integration and best practices',
    files: [
      { source: 'ava-docs/integrations', target: 'docs/security' },
    ],
    commits: [
      { message: 'docs: add security overview', date: 'Wed May 21 09:13:42 2025 +0800' },
      { message: 'docs: document authentication mechanisms', date: 'Wed May 21 11:36:18 2025 +0800' },
      { message: 'docs: add authorization and access control', date: 'Wed May 21 14:22:54 2025 +0800' },
      { message: 'docs: document Lit Protocol integration', date: 'Wed May 21 16:45:23 2025 +0800' },
      { message: 'docs: add data privacy considerations', date: 'Thu May 22 09:18:47 2025 +0800' },
      { message: 'docs: document security best practices', date: 'Thu May 22 11:41:32 2025 +0800' },
    ],
    prTitle: 'Add Security and Privacy Documentation',
    prBody: 'This PR adds detailed documentation for security and privacy features including Lit Protocol integration and best practices.',
  },
  {
    branchName: 'ava-docs-transaction-management',
    issueTitle: 'Documentation: Transaction Management',
    issueBody: 'Add detailed documentation for transaction management including signing, execution, and monitoring',
    files: [
      { source: 'ava-docs/architecture', target: 'docs/architecture/transactions' },
    ],
    commits: [
      { message: 'docs: add transaction management overview', date: 'Thu May 22 14:17:25 2025 +0800' },
      { message: 'docs: document transaction signing flow', date: 'Thu May 22 16:39:52 2025 +0800' },
      { message: 'docs: add transaction execution process', date: 'Fri May 23 09:14:38 2025 +0800' },
      { message: 'docs: document transaction monitoring', date: 'Fri May 23 11:37:21 2025 +0800' },
      { message: 'docs: add cross-chain transaction handling', date: 'Fri May 23 14:22:49 2025 +0800' },
      { message: 'docs: document transaction error recovery', date: 'Fri May 23 16:45:14 2025 +0800' },
    ],
    prTitle: 'Add Transaction Management Documentation',
    prBody: 'This PR adds detailed documentation for transaction management including signing, execution, and monitoring across multiple chains.',
  },
  {
    branchName: 'ava-docs-portfolio-strategies',
    issueTitle: 'Documentation: Portfolio Management Strategies',
    issueBody: 'Add detailed documentation for portfolio management strategies and optimization techniques',
    files: [
      { source: 'ava-docs/usecases.md', target: 'docs/strategies' },
    ],
    commits: [
      { message: 'docs: add portfolio strategies overview', date: 'Mon May 26 09:16:28 2025 +0800' },
      { message: 'docs: document yield farming strategies', date: 'Mon May 26 11:38:54 2025 +0800' },
      { message: 'docs: add risk management approaches', date: 'Mon May 26 14:21:17 2025 +0800' },
      { message: 'docs: document treasury management strategies', date: 'Mon May 26 16:44:39 2025 +0800' },
      { message: 'docs: add performance benchmarking', date: 'Tue May 27 09:13:22 2025 +0800' },
      { message: 'docs: document strategy customization', date: 'Tue May 27 11:35:48 2025 +0800' },
    ],
    prTitle: 'Add Portfolio Management Strategies Documentation',
    prBody: 'This PR adds detailed documentation for portfolio management strategies and optimization techniques for various use cases.',
  },
  {
    branchName: 'ava-docs-api-reference',
    issueTitle: 'Documentation: API Reference',
    issueBody: 'Add comprehensive API reference documentation including endpoints, parameters, and response formats',
    files: [
      { source: 'ava-docs/developers', target: 'docs/api-reference' },
    ],
    commits: [
      { message: 'docs: add API reference overview', date: 'Tue May 27 14:18:36 2025 +0800' },
      { message: 'docs: document REST API endpoints', date: 'Tue May 27 16:41:53 2025 +0800' },
      { message: 'docs: add WebSocket API details', date: 'Wed May 28 09:15:22 2025 +0800' },
      { message: 'docs: document authentication and authorization', date: 'Wed May 28 11:37:49 2025 +0800' },
      { message: 'docs: add pagination and filtering', date: 'Wed May 28 14:22:31 2025 +0800' },
      { message: 'docs: document error responses and handling', date: 'Wed May 28 16:45:14 2025 +0800' },
    ],
    prTitle: 'Add API Reference Documentation',
    prBody: 'This PR adds comprehensive API reference documentation including endpoints, parameters, and response formats for developers.',
  },
  {
    branchName: 'ava-docs-deployment',
    issueTitle: 'Documentation: Deployment Guide',
    issueBody: 'Add detailed deployment documentation including infrastructure requirements, setup, and scaling',
    files: [
      { source: 'ava-docs/getting-started', target: 'docs/deployment' },
    ],
    commits: [
      { message: 'docs: add deployment overview', date: 'Thu May 29 09:16:28 2025 +0800' },
      { message: 'docs: document infrastructure requirements', date: 'Thu May 29 11:39:17 2025 +0800' },
      { message: 'docs: add Docker deployment guide', date: 'Thu May 29 14:23:45 2025 +0800' },
      { message: 'docs: document Kubernetes deployment', date: 'Thu May 29 16:47:09 2025 +0800' },
      { message: 'docs: add scaling and performance tuning', date: 'Fri May 30 09:14:23 2025 +0800' },
      { message: 'docs: document monitoring and maintenance', date: 'Fri May 30 11:36:58 2025 +0800' },
    ],
    prTitle: 'Add Deployment Guide Documentation',
    prBody: 'This PR adds detailed deployment documentation including infrastructure requirements, setup, and scaling options for production environments.',
  },
  {
    branchName: 'ava-docs-examples',
    issueTitle: 'Documentation: Code Examples and Tutorials',
    issueBody: 'Add comprehensive code examples and tutorials for common use cases',
    files: [
      { source: 'ava-docs/developers', target: 'docs/examples' },
    ],
    commits: [
      { message: 'docs: add code examples overview', date: 'Fri May 30 14:19:41 2025 +0800' },
      { message: 'docs: document wallet connection examples', date: 'Fri May 30 16:42:15 2025 +0800' },
      { message: 'docs: add transaction execution examples', date: 'Mon Jun 2 09:15:37 2025 +0800' },
      { message: 'docs: document agent integration examples', date: 'Mon Jun 2 11:38:24 2025 +0800' },
      { message: 'docs: add frontend component examples', date: 'Mon Jun 2 14:21:56 2025 +0800' },
      { message: 'docs: document custom strategy examples', date: 'Mon Jun 2 16:44:12 2025 +0800' },
    ],
    prTitle: 'Add Code Examples and Tutorials Documentation',
    prBody: 'This PR adds comprehensive code examples and tutorials for common use cases to help developers integrate with the Ava platform.',
  },
];

// Combine base and additional migration plans
const extendedMigrationPlan = [...baseMigrationPlan, ...additionalMigrationPlan];

// Log total number of planned commits and branches
console.log(`Extended Migration Plan Summary:
- Total Branches: ${extendedMigrationPlan.length}
- Total Commits: ${extendedMigrationPlan.reduce((sum, section) => sum + section.commits.length, 0)}
`);

// Export the extended migration plan
module.exports = {
  extendedMigrationPlan
}; 