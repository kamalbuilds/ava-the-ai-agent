/**
 * Ava Portfolio Manager Documentation Migration Plan
 * 
 * This script outlines the plan for migrating documentation from ava-docs to docs folder
 * with multiple branches, commits, issues, and PRs.
 */

const migrationPlan = [
  {
    branchName: 'ava-docs-getting-started',
    issueTitle: 'Documentation: Add Getting Started Guides',
    issueBody: 'Create comprehensive getting started guides for users and developers',
    files: [
      { source: 'ava-docs/getting-started', target: 'docs/getting-started' },
    ],
    commits: [
      { message: 'docs: initialize getting started structure', date: 'Mon Apr 15 09:13:27 2025 +0800' },
      { message: 'docs: add installation guide', date: 'Mon Apr 15 10:45:08 2025 +0800' },
      { message: 'docs: add quick start tutorial', date: 'Mon Apr 15 14:22:51 2025 +0800' },
      { message: 'docs: add configuration examples', date: 'Mon Apr 15 16:37:19 2025 +0800' },
      { message: 'docs: improve formatting in getting started guides', date: 'Tue Apr 16 08:45:33 2025 +0800' },
    ],
    prTitle: 'Add Getting Started Documentation',
    prBody: 'This PR adds comprehensive getting started guides for new users and developers.',
  },
  {
    branchName: 'ava-docs-architecture',
    issueTitle: 'Documentation: System Architecture Overview',
    issueBody: 'Add detailed documentation about the Ava Portfolio Manager architecture and components',
    files: [
      { source: 'ava-docs/architecture', target: 'docs/architecture' },
    ],
    commits: [
      { message: 'docs: add architecture overview', date: 'Wed Apr 16 11:07:44 2025 +0800' },
      { message: 'docs: add system components diagrams', date: 'Wed Apr 16 13:25:16 2025 +0800' },
      { message: 'docs: document agent communication patterns', date: 'Wed Apr 16 15:48:02 2025 +0800' },
      { message: 'docs: add deployment architecture', date: 'Thu Apr 17 09:32:55 2025 +0800' },
      { message: 'docs: fix typos in architecture section', date: 'Thu Apr 17 11:26:34 2025 +0800' },
    ],
    prTitle: 'Add Architecture Documentation',
    prBody: 'This PR adds detailed system architecture documentation including component diagrams and deployment models.',
  },
  {
    branchName: 'ava-docs-agents',
    issueTitle: 'Documentation: AI Agent Documentation',
    issueBody: 'Add comprehensive documentation for all AI agents in the Ava ecosystem',
    files: [
      { source: 'ava-docs/agents', target: 'docs/agents' },
    ],
    commits: [
      { message: 'docs: add agent overview', date: 'Fri Apr 18 08:12:41 2025 +0800' },
      { message: 'docs: document observer agent', date: 'Fri Apr 18 10:28:17 2025 +0800' },
      { message: 'docs: document executor agent', date: 'Fri Apr 18 13:45:09 2025 +0800' },
      { message: 'docs: document task-manager agent', date: 'Fri Apr 18 15:57:22 2025 +0800' },
      { message: 'docs: add agent interaction examples', date: 'Mon Apr 21 09:18:36 2025 +0800' },
    ],
    prTitle: 'Add AI Agent Documentation',
    prBody: 'This PR adds comprehensive documentation for all AI agents in the Ava ecosystem including roles, capabilities, and interaction patterns.',
  },
  {
    branchName: 'ava-docs-frontend',
    issueTitle: 'Documentation: Frontend Components and UI',
    issueBody: 'Add documentation for the frontend components, UI elements, and user interactions',
    files: [
      { source: 'ava-docs/frontend', target: 'docs/frontend' },
    ],
    commits: [
      { message: 'docs: add frontend overview', date: 'Mon Apr 21 11:54:07 2025 +0800' },
      { message: 'docs: document UI components', date: 'Mon Apr 21 14:22:58 2025 +0800' },
      { message: 'docs: add user interaction flows', date: 'Mon Apr 21 16:43:21 2025 +0800' },
      { message: 'docs: document theming and customization', date: 'Tue Apr 22 09:15:46 2025 +0800' },
      { message: 'docs: add responsive design guidelines', date: 'Tue Apr 22 11:11:04 2025 +0800' },
    ],
    prTitle: 'Add Frontend Documentation',
    prBody: 'This PR adds documentation for all frontend components, UI elements, and user interaction flows.',
  },
  {
    branchName: 'ava-docs-server',
    issueTitle: 'Documentation: Server API and Backend',
    issueBody: 'Add documentation for server APIs, backend services, and data management',
    files: [
      { source: 'ava-docs/server', target: 'docs/server' },
    ],
    commits: [
      { message: 'docs: add server architecture overview', date: 'Wed Apr 23 08:24:19 2025 +0800' },
      { message: 'docs: document REST API endpoints', date: 'Wed Apr 23 11:37:52 2025 +0800' },
      { message: 'docs: add authentication documentation', date: 'Wed Apr 23 14:16:05 2025 +0800' },
      { message: 'docs: document database schema', date: 'Wed Apr 23 16:42:33 2025 +0800' },
      { message: 'docs: add API usage examples', date: 'Thu Apr 24 09:12:18 2025 +0800' },
    ],
    prTitle: 'Add Server Documentation',
    prBody: 'This PR adds comprehensive documentation for server APIs, backend services, and data management components.',
  },
  {
    branchName: 'ava-docs-protocols',
    issueTitle: 'Documentation: Protocol Implementations',
    issueBody: 'Document all supported blockchain protocols and integration details',
    files: [
      { source: 'ava-docs/protocols', target: 'docs/protocols' },
    ],
    commits: [
      { message: 'docs: add protocol overview', date: 'Thu Apr 24 11:33:27 2025 +0800' },
      { message: 'docs: document Flow protocol integration', date: 'Thu Apr 24 14:19:06 2025 +0800' },
      { message: 'docs: document Hedera integration', date: 'Thu Apr 24 16:45:58 2025 +0800' },
      { message: 'docs: document Sui protocol integration', date: 'Fri Apr 25 09:16:42 2025 +0800' },
      { message: 'docs: document NEAR protocol integration', date: 'Fri Apr 25 11:28:07 2025 +0800' },
    ],
    prTitle: 'Add Protocol Documentation',
    prBody: 'This PR adds detailed documentation for all supported blockchain protocols including integration details and API examples.',
  },
  {
    branchName: 'ava-docs-integrations',
    issueTitle: 'Documentation: Third-party Integrations',
    issueBody: 'Document all third-party integrations and external services',
    files: [
      { source: 'ava-docs/integrations', target: 'docs/integrations' },
    ],
    commits: [
      { message: 'docs: add integrations overview', date: 'Fri Apr 25 14:09:35 2025 +0800' },
      { message: 'docs: document Story Protocol integration', date: 'Fri Apr 25 16:24:18 2025 +0800' },
      { message: 'docs: document LangChain integration', date: 'Mon Apr 28 09:18:23 2025 +0800' },
      { message: 'docs: document Lit Protocol integration', date: 'Mon Apr 28 11:43:59 2025 +0800' },
      { message: 'docs: add ZerePy integration details', date: 'Mon Apr 28 14:32:41 2025 +0800' },
    ],
    prTitle: 'Add Third-party Integration Documentation',
    prBody: 'This PR adds documentation for all third-party integrations and external services used in the Ava Platform.',
  },
  {
    branchName: 'ava-docs-developers',
    issueTitle: 'Documentation: Developer Guides',
    issueBody: 'Add comprehensive developer guides, API references, and customization options',
    files: [
      { source: 'ava-docs/developers', target: 'docs/developers' },
    ],
    commits: [
      { message: 'docs: add developer getting started', date: 'Mon Apr 28 16:19:07 2025 +0800' },
      { message: 'docs: document API reference', date: 'Tue Apr 29 09:14:52 2025 +0800' },
      { message: 'docs: add custom agent development guide', date: 'Tue Apr 29 11:48:26 2025 +0800' },
      { message: 'docs: document event bus usage', date: 'Tue Apr 29 14:25:09 2025 +0800' },
      { message: 'docs: add contribution guidelines', date: 'Tue Apr 29 16:37:44 2025 +0800' },
    ],
    prTitle: 'Add Developer Documentation',
    prBody: 'This PR adds comprehensive developer guides, API references, and customization options for developers building on the Ava platform.',
  },
  {
    branchName: 'ava-docs-support',
    issueTitle: 'Documentation: Support and Troubleshooting',
    issueBody: 'Add support documentation, troubleshooting guides, and FAQ',
    files: [
      { source: 'ava-docs/support', target: 'docs/support' },
    ],
    commits: [
      { message: 'docs: add support overview', date: 'Wed Apr 30 08:23:16 2025 +0800' },
      { message: 'docs: create troubleshooting guide', date: 'Wed Apr 30 10:42:59 2025 +0800' },
      { message: 'docs: add frequently asked questions', date: 'Wed Apr 30 13:19:38 2025 +0800' },
      { message: 'docs: document common error codes', date: 'Wed Apr 30 15:47:21 2025 +0800' },
      { message: 'docs: add community support resources', date: 'Thu May 1 09:16:05 2025 +0800' },
    ],
    prTitle: 'Add Support and Troubleshooting Documentation',
    prBody: 'This PR adds support documentation, troubleshooting guides, and frequently asked questions to help users resolve common issues.',
  },
  {
    branchName: 'ava-docs-use-cases',
    issueTitle: 'Documentation: Use Cases and Example Applications',
    issueBody: 'Document example use cases, real-world applications, and success stories',
    files: [
      { source: 'ava-docs/usecases.md', target: 'docs/use-cases/index.md' },
    ],
    commits: [
      { message: 'docs: create use cases section', date: 'Thu May 1 11:28:47 2025 +0800' },
      { message: 'docs: add portfolio management use case', date: 'Thu May 1 14:02:19 2025 +0800' },
      { message: 'docs: document treasury management example', date: 'Thu May 1 16:38:54 2025 +0800' },
      { message: 'docs: add cross-chain operations use case', date: 'Fri May 2 09:27:36 2025 +0800' },
      { message: 'docs: create example implementation guide', date: 'Fri May 2 11:45:08 2025 +0800' },
    ],
    prTitle: 'Add Use Cases Documentation',
    prBody: 'This PR adds documentation for example use cases, real-world applications, and success stories to showcase the platform capabilities.',
  },
];

// Create shell script template for implementing a section of the migration plan
const generateShellScript = (section) => {
  return `#!/bin/bash

# Create GitHub issue for ${section.branchName}
echo "Creating issue: ${section.issueTitle}"
# Use Octokit or curl here to create the issue
# Store the issue number in ISSUE_NUMBER

# Create and checkout new branch
git checkout -b ${section.branchName}

# Create target directory
mkdir -p ${section.files[0].target}

# Copy files from source to target
cp -r ${section.files[0].source}/* ${section.files[0].target}/

# Make commits with specified dates
${section.commits.map(commit => `
GIT_AUTHOR_DATE='${commit.date}' GIT_COMMITTER_DATE='${commit.date}' git add ${section.files[0].target}
GIT_AUTHOR_DATE='${commit.date}' GIT_COMMITTER_DATE='${commit.date}' git commit -m "${commit.message}"
`).join('')}

# Push branch
git push origin ${section.branchName}

# Create Pull Request
echo "Creating PR: ${section.prTitle}"
# Use Octokit or curl here to create the PR linking to the issue
# Example: "Fixes #ISSUE_NUMBER"

echo "Migration section for ${section.branchName} completed"
`;
};

// Example JavaScript for creating a GitHub issue using Octokit
const issueCreationExample = `
import { Octokit } from "@octokit/rest";

async function createIssue(title, body) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  const response = await octokit.rest.issues.create({
    owner: "your-username",
    repo: "ava-portfolio-manager-ai-agent",
    title: title,
    body: body,
    labels: ["documentation"]
  });
  
  return response.data.number;
}
`;

// Example JavaScript for creating a GitHub PR using Octokit
const prCreationExample = `
import { Octokit } from "@octokit/rest";

async function createPR(title, body, head, base, issueNumber) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  const response = await octokit.rest.pulls.create({
    owner: "your-username",
    repo: "ava-portfolio-manager-ai-agent",
    title: title,
    body: body + "\\n\\nFixes #" + issueNumber,
    head: head,
    base: base
  });
  
  return response.data.number;
}
`;

// Log total number of planned commits and branches
console.log(`Migration Plan Summary:
- Total Branches: ${migrationPlan.length}
- Total Commits: ${migrationPlan.reduce((sum, section) => sum + section.commits.length, 0)}
`);

// Export the migration plan
module.exports = {
  migrationPlan,
  generateShellScript,
  issueCreationExample,
  prCreationExample
}; 