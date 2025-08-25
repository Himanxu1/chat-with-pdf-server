#!/bin/bash

# Log Sync Script for ChatPDF Server
# This script syncs PM2 logs to Google Cloud Storage

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
PM2_LOG_DIR="$PROJECT_ROOT/.logs"
GCP_BUCKET="${LOG_SYNC_BUCKET:-chatpdf-logs}"
SYNC_INTERVAL_HOURS="${LOG_SYNC_INTERVAL_HOURS:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if gsutil is available
check_gsutil() {
    if ! command -v gsutil &> /dev/null; then
        error "gsutil is not installed. Please install Google Cloud SDK."
        exit 1
    fi
}

# Check if we're authenticated with GCP
check_auth() {
    if ! gsutil ls "gs://$GCP_BUCKET" &> /dev/null; then
        error "Not authenticated with GCP or bucket doesn't exist: gs://$GCP_BUCKET"
        exit 1
    fi
}

# Create timestamp for this sync
get_timestamp() {
    date +"%Y%m%d_%H%M%S"
}

# Create folder structure in GCP
get_gcp_path() {
    local timestamp=$(get_timestamp)
    local date_folder=$(date +"%Y/%m/%d")
    echo "logs/$date_folder/$timestamp"
}

# Sync logs to GCP
sync_logs() {
    local gcp_path=$(get_gcp_path)
    local timestamp=$(get_timestamp)
    
    log "Starting log sync to gs://$GCP_BUCKET/$gcp_path"
    
    # Create temporary directory for this sync
    local temp_dir="/tmp/chatpdf_logs_$timestamp"
    mkdir -p "$temp_dir"
    
    # Copy logs to temp directory with proper structure
    if [ -d "$LOG_DIR" ]; then
        cp -r "$LOG_DIR"/* "$temp_dir/" 2>/dev/null || true
    fi
    
    if [ -d "$PM2_LOG_DIR" ]; then
        cp -r "$PM2_LOG_DIR"/* "$temp_dir/" 2>/dev/null || true
    fi
    
    # Check if we have any logs to sync
    if [ -z "$(ls -A "$temp_dir" 2>/dev/null)" ]; then
        warn "No logs found to sync"
        rm -rf "$temp_dir"
        return 0
    fi
    
    # Create a summary file
    local summary_file="$temp_dir/sync_summary.txt"
    {
        echo "ChatPDF Log Sync Summary"
        echo "========================"
        echo "Sync Time: $(date)"
        echo "Server: $(hostname)"
        echo "Project: ChatPDF Server"
        echo "Log Files:"
        find "$temp_dir" -type f -name "*.log" | while read -r file; do
            echo "  - $(basename "$file") ($(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "unknown") bytes)"
        done
    } > "$summary_file"
    
    # Upload to GCP
    if gsutil -m cp -r "$temp_dir"/* "gs://$GCP_BUCKET/$gcp_path/"; then
        log "Successfully synced logs to gs://$GCP_BUCKET/$gcp_path/"
        
        # Create a marker file to indicate successful sync
        echo "$(date): Logs synced successfully" > "$temp_dir/sync_complete.txt"
        gsutil cp "$temp_dir/sync_complete.txt" "gs://$GCP_BUCKET/$gcp_path/"
        
        # Clean up old logs (keep last 7 days locally)
        find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
        find "$PM2_LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
        
    else
        error "Failed to sync logs to GCP"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Clean up temp directory
    rm -rf "$temp_dir"
}

# Main function
main() {
    log "ChatPDF Log Sync Script Started"
    
    # Check prerequisites
    check_gsutil
    check_auth
    
    # Perform sync
    if sync_logs; then
        log "Log sync completed successfully"
        exit 0
    else
        error "Log sync failed"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "manual")
        log "Running manual log sync"
        main
        ;;
    "setup")
        log "Setting up log sync configuration"
        echo "To enable automatic log sync, add this to your crontab:"
        echo "0 */$SYNC_INTERVAL_HOURS * * * $SCRIPT_DIR/sync-logs.sh manual"
        ;;
    *)
        main
        ;;
esac

