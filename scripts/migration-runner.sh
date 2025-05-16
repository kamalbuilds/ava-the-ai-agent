#!/bin/bash
# Migration Runner Script
# This script helps run the documentation migration in smaller batches

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Extract command-line arguments first to check for list or dry-run options
for arg in "$@"; do
  if [ "$arg" = "--list" ] || [ "$arg" = "--help" ]; then
    LIST_OR_HELP=true
    break
  fi
  if [ "$arg" = "--dry-run" ]; then
    DRY_RUN=true
    break
  fi
done

# Check if GitHub token is set (only if not just listing or showing help or dry run)
if [ -z "$GITHUB_TOKEN" ] && [ "$LIST_OR_HELP" != "true" ] && [ "$DRY_RUN" != "true" ]; then
  echo -e "${RED}Error: GITHUB_TOKEN environment variable is not set.${NC}"
  echo -e "Please set it with: export GITHUB_TOKEN=your_github_token"
  echo -e "Or use --dry-run to simulate without making actual changes."
  exit 1
fi

# Function to run a migration section
run_section() {
  local section=$1
  local dry_run=$2
  
  echo -e "\n${BLUE}=====================================================${NC}"
  echo -e "${BLUE}Running migration for section: ${YELLOW}$section${NC}"
  echo -e "${BLUE}=====================================================${NC}\n"
  
  if [ "$dry_run" = "true" ]; then
    node scripts/execute-docs-migration.js --section=$section --dry-run
  else
    node scripts/execute-docs-migration.js --section=$section
  fi
  
  echo -e "\n${GREEN}Completed migration for section: ${YELLOW}$section${NC}\n"
}

# Display help information
show_help() {
  echo -e "${BLUE}Ava Documentation Migration Runner${NC}"
  echo -e "Usage: $0 [OPTIONS]"
  echo -e "\nOptions:"
  echo -e "  --help              Show this help message"
  echo -e "  --list              List all available migration sections"
  echo -e "  --run=SECTION       Run a specific migration section"
  echo -e "  --run-all           Run all migration sections"
  echo -e "  --run-batch=N       Run a batch of N sections"
  echo -e "  --start-from=N      Start running from the Nth section"
  echo -e "  --dry-run           Simulate the migration without making changes"
  echo -e "\nExamples:"
  echo -e "  $0 --list"
  echo -e "  $0 --run=ava-docs-getting-started --dry-run"
  echo -e "  $0 --run-batch=5 --start-from=10"
  echo -e "  $0 --run-all"
}

# Get all migration sections directly from the migration plan code
get_sections() {
  # Just use a simple grep to extract section names
  grep "branchName: " scripts/docs-migration-plan.js scripts/extended-docs-migration-plan.js | 
    grep -o "'[^']*'" | 
    grep "ava-docs" | 
    tr -d "'" | 
    sort -u
}

# List all migration sections
list_sections() {
  echo -e "${BLUE}Available migration sections:${NC}"
  local i=1
  while IFS= read -r section; do
    echo -e "$i. $section"
    i=$((i+1))
  done < <(get_sections)
}

# Load sections into an array
load_sections() {
  echo -e "${BLUE}Loading migration sections...${NC}"
  # Initialize empty array
  SECTIONS=()
  
  # Read sections into array
  while IFS= read -r section; do
    SECTIONS+=("$section")
  done < <(get_sections)
  
  TOTAL_SECTIONS=${#SECTIONS[@]}
  echo -e "${GREEN}Loaded $TOTAL_SECTIONS sections.${NC}"
}

# Extract command-line arguments
DRY_RUN=false
SECTION=""
RUN_ALL=false
BATCH_SIZE=0
START_FROM=1 # Start from 1 by default

for arg in "$@"; do
  case $arg in
    --help)
      show_help
      exit 0
      ;;
    --list)
      list_sections
      exit 0
      ;;
    --run=*)
      SECTION="${arg#*=}"
      ;;
    --run-all)
      RUN_ALL=true
      ;;
    --run-batch=*)
      BATCH_SIZE="${arg#*=}"
      ;;
    --start-from=*)
      START_FROM="${arg#*=}"
      ;;
    --dry-run)
      DRY_RUN=true
      echo -e "${YELLOW}Running in DRY RUN mode. No changes will be made.${NC}"
      ;;
    *)
      echo -e "${RED}Unknown option: $arg${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Load all sections
load_sections

# Run a specific section
if [ -n "$SECTION" ]; then
  # Check if section exists
  SECTION_EXISTS=false
  for s in "${SECTIONS[@]}"; do
    if [ "$s" = "$SECTION" ]; then
      SECTION_EXISTS=true
      break
    fi
  done
  
  if [ "$SECTION_EXISTS" = false ]; then
    echo -e "${RED}Error: Section '$SECTION' not found.${NC}"
    echo -e "Use --list to see available sections."
    exit 1
  fi
  
  run_section "$SECTION" "$DRY_RUN"
  exit 0
fi

# Run all sections
if [ "$RUN_ALL" = true ]; then
  echo -e "${YELLOW}Running all migration sections...${NC}"
  
  for section in "${SECTIONS[@]}"; do
    run_section "$section" "$DRY_RUN"
  done
  
  echo -e "\n${GREEN}All migration sections completed successfully!${NC}"
  exit 0
fi

# Run a batch of sections
if [ "$BATCH_SIZE" -gt 0 ]; then
  echo -e "${YELLOW}Running batch of $BATCH_SIZE sections starting from position $START_FROM...${NC}"
  
  # Check if start index is valid
  if [ "$START_FROM" -lt 1 ] || [ "$START_FROM" -gt "$TOTAL_SECTIONS" ]; then
    echo -e "${RED}Error: Invalid start position. Must be between 1 and $TOTAL_SECTIONS.${NC}"
    exit 1
  fi
  
  # Calculate end index (inclusive)
  END_INDEX=$((START_FROM + BATCH_SIZE - 1))
  
  # Check if end index exceeds array length
  if [ "$END_INDEX" -gt "$TOTAL_SECTIONS" ]; then
    END_INDEX="$TOTAL_SECTIONS"
    echo -e "${YELLOW}Adjusted batch size to reach the end of available sections.${NC}"
  fi
  
  echo -e "${BLUE}Processing sections from $START_FROM to $END_INDEX of $TOTAL_SECTIONS total sections.${NC}"
  
  # Run the specified batch
  for ((i = START_FROM - 1; i < END_INDEX; i++)); do
    run_section "${SECTIONS[$i]}" "$DRY_RUN"
  done
  
  echo -e "\n${GREEN}Batch migration completed successfully!${NC}"
  exit 0
fi

# If no action specified, show help
if [ -z "$SECTION" ] && [ "$RUN_ALL" = false ] && [ "$BATCH_SIZE" -eq 0 ]; then
  echo -e "${RED}No action specified.${NC}"
  show_help
  exit 1
fi 