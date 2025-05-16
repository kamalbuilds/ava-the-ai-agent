# Ava Documentation Migration Tool

This tool helps you migrate documentation from the `ava-docs` folder to a new `docs` folder in your main repository. The migration is done in multiple branches and commits to maintain a clean history and allow for proper code review.

## Features

- Creates 25 branches for different documentation sections
- Makes 150+ commits with customized timestamps
- Creates GitHub issues for each section
- Creates pull requests linking to issues
- Supports dry-run mode to preview changes
- Supports running migrations in batches

## Prerequisites

- Node.js 14+
- Git
- GitHub personal access token with `repo` scope
- Source documentation in `ava-docs` folder

## Installation

1. Install dependencies:

```bash
npm install @octokit/rest
```

2. Set up your GitHub token:

```bash
export GITHUB_TOKEN=your_github_token
```

## Configuration

Before running the migration, update the configuration in `scripts/execute-docs-migration.js`:

```javascript
const config = {
  owner: 'your-username', // Replace with your GitHub username
  repo: 'ava-portfolio-manager-ai-agent', // Replace with your repo name
  baseBranch: 'main', // The base branch for all PRs
  // ... other config
};
```

## Usage

### Running the Migration

Use the migration runner script to run the migration:

```bash
# List all available migration sections
./scripts/migration-runner.sh --list

# Run a specific section in dry-run mode
./scripts/migration-runner.sh --run=ava-docs-getting-started --dry-run

# Run a batch of 5 sections starting from the 10th section
./scripts/migration-runner.sh --run-batch=5 --start-from=10

# Run all sections
./scripts/migration-runner.sh --run-all
```

### Migration Plan

The migration is split into 25 branches:

1. **Base Documentation Structure (10 branches):**
   - `ava-docs-getting-started` - Getting started guides
   - `ava-docs-architecture` - System architecture overview
   - `ava-docs-agents` - AI agent documentation
   - `ava-docs-frontend` - Frontend components and UI
   - `ava-docs-server` - Server API and backend
   - `ava-docs-protocols` - Protocol implementations
   - `ava-docs-integrations` - Third-party integrations
   - `ava-docs-developers` - Developer guides
   - `ava-docs-support` - Support and troubleshooting
   - `ava-docs-use-cases` - Use cases and example applications

2. **Detailed Documentation (15 branches):**
   - `ava-docs-near-protocol` - NEAR Protocol integration details
   - `ava-docs-flow-protocol` - Flow Protocol integration details
   - `ava-docs-hedera-protocol` - Hedera Protocol integration details
   - `ava-docs-observer-agent` - Observer Agent details
   - `ava-docs-executor-agent` - Executor Agent details
   - `ava-docs-task-manager-agent` - Task Manager Agent details
   - `ava-docs-a2a-protocol` - Agent-to-Agent (A2A) Protocol
   - `ava-docs-event-bus` - Event Bus architecture
   - `ava-docs-security` - Security and privacy
   - `ava-docs-transaction-management` - Transaction management
   - `ava-docs-portfolio-strategies` - Portfolio management strategies
   - `ava-docs-api-reference` - API reference
   - `ava-docs-deployment` - Deployment guide
   - `ava-docs-examples` - Code examples and tutorials

## Best Practices

- Run migrations in dry-run mode first to verify changes
- Run migrations in small batches to avoid overwhelming GitHub API limits
- Review each PR before merging to ensure quality
- Allow time between PR creation and merging for proper review

## Troubleshooting

- **GitHub API rate limits**: If you hit GitHub API rate limits, wait for an hour before continuing
- **Failed commits**: If a commit fails, you can retry the section with `--run=section-name`
- **Missing files**: Ensure the `ava-docs` folder contains all necessary files before running the migration 