#!/bin/bash

# Setup script for ChatPDF Log Sync
# This script helps configure log sync to GCP Cloud Storage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        error ".env file not found. Please create it from env.example first."
        exit 1
    fi
}

# Install Google Cloud SDK
install_gcloud() {
    info "Checking Google Cloud SDK installation..."
    
    if command -v gcloud &> /dev/null; then
        log "Google Cloud SDK is already installed"
        return 0
    fi
    
    warn "Google Cloud SDK not found. Installing..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install --cask google-cloud-sdk
        else
            error "Homebrew not found. Please install Google Cloud SDK manually:"
            error "https://cloud.google.com/sdk/docs/install"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
        curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key --keyring /usr/share/keyrings/cloud.google.gpg add -
        sudo apt-get update && sudo apt-get install google-cloud-sdk
    else
        error "Unsupported operating system. Please install Google Cloud SDK manually:"
        error "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    log "Google Cloud SDK installed successfully"
}

# Authenticate with Google Cloud
authenticate_gcloud() {
    info "Setting up Google Cloud authentication..."
    
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log "Already authenticated with Google Cloud"
        return 0
    fi
    
    warn "Not authenticated with Google Cloud. Please authenticate:"
    gcloud auth login
    
    if [ $? -eq 0 ]; then
        log "Google Cloud authentication successful"
    else
        error "Google Cloud authentication failed"
        exit 1
    fi
}

# Configure GCP project
configure_project() {
    info "Configuring GCP project..."
    
    echo -n "Enter your GCP Project ID: "
    read -r project_id
    
    if [ -z "$project_id" ]; then
        error "Project ID cannot be empty"
        exit 1
    fi
    
    # Set the project
    gcloud config set project "$project_id"
    
    # Update .env file
    sed -i.bak "s/GCP_PROJECT_ID=.*/GCP_PROJECT_ID=$project_id/" "$ENV_FILE"
    
    log "GCP project configured: $project_id"
}

# Create GCP buckets
create_buckets() {
    info "Creating GCP buckets..."
    
    echo -n "Enter bucket name for PDF storage (or press Enter for default): "
    read -r pdf_bucket
    
    if [ -z "$pdf_bucket" ]; then
        pdf_bucket="chatpdf-pdfs-$(gcloud config get-value project)"
    fi
    
    echo -n "Enter bucket name for logs (or press Enter for default): "
    read -r logs_bucket
    
    if [ -z "$logs_bucket" ]; then
        logs_bucket="chatpdf-logs-$(gcloud config get-value project)"
    fi
    
    # Create PDF bucket
    if ! gsutil ls "gs://$pdf_bucket" &> /dev/null; then
        gsutil mb "gs://$pdf_bucket"
        gsutil iam ch allUsers:objectViewer "gs://$pdf_bucket"
        log "Created PDF bucket: gs://$pdf_bucket"
    else
        log "PDF bucket already exists: gs://$pdf_bucket"
    fi
    
    # Create logs bucket
    if ! gsutil ls "gs://$logs_bucket" &> /dev/null; then
        gsutil mb "gs://$logs_bucket"
        log "Created logs bucket: gs://$logs_bucket"
    else
        log "Logs bucket already exists: gs://$logs_bucket"
    fi
    
    # Update .env file
    sed -i.bak "s/GCP_STORAGE_BUCKET=.*/GCP_STORAGE_BUCKET=$pdf_bucket/" "$ENV_FILE"
    sed -i.bak "s/LOG_SYNC_BUCKET=.*/LOG_SYNC_BUCKET=$logs_bucket/" "$ENV_FILE"
    
    log "Buckets configured successfully"
}

# Create service account
create_service_account() {
    info "Creating service account for application..."
    
    project_id=$(gcloud config get-value project)
    service_account_name="chatpdf-service-account"
    service_account_email="$service_account_name@$project_id.iam.gserviceaccount.com"
    
    # Check if service account already exists
    if gcloud iam service-accounts describe "$service_account_email" &> /dev/null; then
        log "Service account already exists: $service_account_email"
    else
        # Create service account
        gcloud iam service-accounts create "$service_account_name" \
            --display-name="ChatPDF Service Account" \
            --description="Service account for ChatPDF application"
        
        log "Created service account: $service_account_email"
    fi
    
    # Grant necessary permissions
    gsutil iam ch "serviceAccount:$service_account_email:objectAdmin" "gs://$(grep GCP_STORAGE_BUCKET "$ENV_FILE" | cut -d'=' -f2)"
    gsutil iam ch "serviceAccount:$service_account_email:objectAdmin" "gs://$(grep LOG_SYNC_BUCKET "$ENV_FILE" | cut -d'=' -f2)"
    
    # Create and download key
    key_file="$PROJECT_ROOT/service-account-key.json"
    gcloud iam service-accounts keys create "$key_file" \
        --iam-account="$service_account_email"
    
    # Update .env file
    sed -i.bak "s|GCP_KEY_FILE_PATH=.*|GCP_KEY_FILE_PATH=$key_file|" "$ENV_FILE"
    
    log "Service account key created: $key_file"
    warn "Keep this key file secure and do not commit it to version control!"
}

# Enable log sync
enable_log_sync() {
    info "Enabling log sync..."
    
    # Update .env file
    sed -i.bak "s/LOG_SYNC_ENABLED=.*/LOG_SYNC_ENABLED=true/" "$ENV_FILE"
    
    # Set up cron job
    cron_job="0 */10 * * * $SCRIPT_DIR/sync-logs.sh manual"
    
    if crontab -l 2>/dev/null | grep -q "sync-logs.sh"; then
        log "Cron job already exists"
    else
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        log "Cron job added for log sync every 10 hours"
    fi
    
    log "Log sync enabled successfully"
}

# Test configuration
test_configuration() {
    info "Testing configuration..."
    
    # Test bucket access
    pdf_bucket=$(grep GCP_STORAGE_BUCKET "$ENV_FILE" | cut -d'=' -f2)
    logs_bucket=$(grep LOG_SYNC_BUCKET "$ENV_FILE" | cut -d'=' -f2)
    
    if gsutil ls "gs://$pdf_bucket" &> /dev/null; then
        log "✓ PDF bucket access: OK"
    else
        error "✗ PDF bucket access: FAILED"
    fi
    
    if gsutil ls "gs://$logs_bucket" &> /dev/null; then
        log "✓ Logs bucket access: OK"
    else
        error "✗ Logs bucket access: FAILED"
    fi
    
    # Test log sync script
    if "$SCRIPT_DIR/sync-logs.sh" setup &> /dev/null; then
        log "✓ Log sync script: OK"
    else
        error "✗ Log sync script: FAILED"
    fi
}

# Main setup function
main() {
    log "ChatPDF Log Sync Setup"
    log "======================"
    
    check_env_file
    install_gcloud
    authenticate_gcloud
    configure_project
    create_buckets
    create_service_account
    enable_log_sync
    test_configuration
    
    log ""
    log "Setup completed successfully!"
    log ""
    log "Next steps:"
    log "1. Review the .env file configuration"
    log "2. Start your application: npm run dev"
    log "3. Test log sync manually: ./scripts/sync-logs.sh manual"
    log ""
    log "The log sync will run automatically every 10 hours via cron."
}

# Handle script arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "ChatPDF Log Sync Setup Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no args)  Run full setup"
        echo "  help       Show this help message"
        echo ""
        echo "This script will:"
        echo "1. Install Google Cloud SDK"
        echo "2. Authenticate with Google Cloud"
        echo "3. Configure GCP project and buckets"
        echo "4. Create service account"
        echo "5. Enable log sync"
        echo "6. Test configuration"
        ;;
    *)
        main
        ;;
esac

