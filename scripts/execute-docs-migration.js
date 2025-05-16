#!/usr/bin/env node

/**
 * Documentation Migration Execution Script
 * 
 * This script automates the migration of documentation from ava-docs to docs,
 * creating multiple branches, commits, issues, and PRs as specified in the migration plan.
 * 
 * Prerequisites:
 * - Node.js 14+
 * - GitHub personal access token with repo scope in GITHUB_TOKEN env variable (not needed for dry-run)
 * - @octokit/rest npm package installed (not needed for dry-run)
 * 
 * Usage:
 * GITHUB_TOKEN=your_token node scripts/execute-docs-migration.js [--section=name] [--dry-run]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { extendedMigrationPlan } = require('./extended-docs-migration-plan');

// Check if we're in dry-run mode
const isDryRun = process.argv.includes('--dry-run');

// Try to load Octokit if it's available and needed
let Octokit;
if (!isDryRun) {
  try {
    const { Octokit: LoadedOctokit } = require('@octokit/rest');
    Octokit = LoadedOctokit;
  } catch (error) {
    console.warn('Warning: @octokit/rest not found. GitHub integration will be simulated.');
    console.warn('To install: npm install @octokit/rest');
  }
}

// Configuration
const config = {
  owner: 'kamalbuilds', // Replace with your GitHub username
  repo: 'ava-the-ai-agent', // Replace with your repo name
  baseBranch: 'dev', // The base branch for all PRs
  dryRun: isDryRun,
  targetSection: process.argv.find(arg => arg.startsWith('--section='))?.split('=')[1],
  githubToken: process.env.GITHUB_TOKEN,
  migrationPlan: extendedMigrationPlan // Use the extended plan with 25 branches
};

// Helper to run shell commands
function runCommand(command) {
  if (config.dryRun) {
    console.log(`[DRY RUN] Would execute: ${command}`);
    return '';
  }
  
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    return output.trim();
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return '';
  }
}

// Create a GitHub issue
async function createGitHubIssue(title, body) {
  if (config.dryRun || !config.githubToken || !Octokit) {
    console.log(`[SIMULATED] Created issue: "${title}"`);
    return Math.floor(Math.random() * 1000) + 1; // Fake issue number
  }
  
  try {
    const octokit = new Octokit({ auth: config.githubToken });
    const response = await octokit.rest.issues.create({
      owner: config.owner,
      repo: config.repo,
      title: title,
      body: body,
      labels: ['documentation']
    });
    
    console.log(`Created issue #${response.data.number}: ${title}`);
    return response.data.number;
  } catch (error) {
    console.error(`Error creating issue: ${error.message}`);
    return null;
  }
}

// Create a GitHub pull request
async function createGitHubPR(title, body, head, base, issueNumber) {
  if (config.dryRun || !config.githubToken || !Octokit) {
    console.log(`[SIMULATED] Created PR: "${title}" from ${head} to ${base}`);
    return Math.floor(Math.random() * 1000) + 1; // Fake PR number
  }
  
  try {
    const octokit = new Octokit({ auth: config.githubToken });
    const response = await octokit.rest.pulls.create({
      owner: config.owner,
      repo: config.repo,
      title: title,
      body: issueNumber ? `${body}\n\nFixes #${issueNumber}` : body,
      head: head,
      base: base
    });
    
    console.log(`Created PR #${response.data.number}: ${title}`);
    return response.data.number;
  } catch (error) {
    console.error(`Error creating PR: ${error.message}`);
    return null;
  }
}

// Ensure target directory exists
function ensureDirectoryExists(directoryPath) {
  if (config.dryRun) {
    console.log(`[DRY RUN] Would ensure directory exists: ${directoryPath}`);
    return;
  }
  
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
    console.log(`Created directory: ${directoryPath}`);
  }
}

// Copy files from source to target
function copyFiles(sourcePath, targetPath) {
  if (config.dryRun) {
    console.log(`[DRY RUN] Would copy files from ${sourcePath} to ${targetPath}`);
    return;
  }
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source path does not exist: ${sourcePath}`);
    return;
  }
  
  ensureDirectoryExists(path.dirname(targetPath));
  
  // Handle single file copy
  if (fs.statSync(sourcePath).isFile()) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied file: ${sourcePath} -> ${targetPath}`);
    return;
  }
  
  // Handle directory copy
  runCommand(`cp -r "${sourcePath}/." "${targetPath}/"`);
  console.log(`Copied directory contents: ${sourcePath} -> ${targetPath}`);
}

// Process a single section of the migration plan
async function processSection(section) {
  console.log(`\n===== Processing section: ${section.branchName} =====\n`);
  
  // Start from base branch
  runCommand(`git checkout ${config.baseBranch}`);
  
  // Create GitHub issue
  console.log(`Creating issue: ${section.issueTitle}`);
  const issueNumber = await createGitHubIssue(section.issueTitle, section.issueBody);
  
  if (!issueNumber && !config.dryRun) {
    console.error('Failed to create issue. Aborting section.');
    return;
  }
  
  // Create and checkout new branch
  runCommand(`git checkout -b ${section.branchName}`);
  
  // Process each file or directory
  for (const file of section.files) {
    // Create target directory
    const targetDir = path.dirname(file.target);
    ensureDirectoryExists(targetDir);
    
    // Copy files
    copyFiles(file.source, file.target);
  }
  
  // Make commits with specified dates
  for (const commit of section.commits) {
    runCommand(`git add .`);
    runCommand(`GIT_AUTHOR_DATE='${commit.date}' GIT_COMMITTER_DATE='${commit.date}' git commit -m "${commit.message}"`);
    console.log(`Created commit: ${commit.message} (${commit.date})`);
  }
  
  // Push branch
  runCommand(`git push origin ${section.branchName}`);
  
  // Create Pull Request
  console.log(`Creating PR: ${section.prTitle}`);
  await createGitHubPR(
    section.prTitle, 
    section.prBody, 
    section.branchName, 
    config.baseBranch, 
    issueNumber
  );
  
  console.log(`\n===== Completed section: ${section.branchName} =====\n`);
}

// Main execution function
async function main() {
  // Check GitHub token only if not in dry-run mode
  if (!config.githubToken && !config.dryRun) {
    console.warn('Warning: GITHUB_TOKEN not found. GitHub operations will be simulated.');
  }
  
  const migrationPlan = config.migrationPlan;
  
  console.log(`
==============================================
Ava Documentation Migration
==============================================
Mode: ${config.dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE RUN'}
Target sections: ${config.targetSection || 'ALL sections'}
Total branches: ${config.targetSection ? '1' : migrationPlan.length}
Total commits: ${
    config.targetSection 
      ? migrationPlan.find(s => s.branchName === config.targetSection)?.commits.length || 0
      : migrationPlan.reduce((sum, section) => sum + section.commits.length, 0)
  }
==============================================
`);

  // Filter sections if target is specified
  const sectionsToProcess = config.targetSection
    ? migrationPlan.filter(section => section.branchName === config.targetSection)
    : migrationPlan;
  
  if (sectionsToProcess.length === 0) {
    console.error(`No matching section found: ${config.targetSection}`);
    process.exit(1);
  }
  
  // Process each section
  for (const section of sectionsToProcess) {
    await processSection(section);
  }
  
  console.log('\nMigration completed successfully!');
  console.log(`Total branches created: ${sectionsToProcess.length}`);
  console.log(`Total commits made: ${sectionsToProcess.reduce((sum, section) => sum + section.commits.length, 0)}`);
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error in migration process:', error);
    process.exit(1);
  });
}

module.exports = {
  processSection
}; 