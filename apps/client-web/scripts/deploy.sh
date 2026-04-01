#!/bin/bash

# ============================================
# FGVPN Client Web - Deployment Script
# Usage: ./scripts/deploy.sh [environment] [options]
# ============================================

set -e

# ============================================
# Configuration
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_NAME="fgvpn-client-web"
VERSION=$(node -p "require('$PROJECT_DIR/package.json').version")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Default values
ENVIRONMENT="staging"
SKIP_TESTS=false
SKIP_BUILD=false
DOCKER_DEPLOY=false
ROLLBACK=false
BACKUP_DIR="/var/backups/$APP_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Helper Functions
# ============================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

FGVPN Client Web Deployment Script

Options:
    -e, --environment   Target environment (staging|production) [default: staging]
    -s, --skip-tests    Skip running tests
    -b, --skip-build    Skip building the application
    -d, --docker        Deploy using Docker
    -r, --rollback      Rollback to previous version
    -h, --help          Show this help message

Examples:
    $(basename "$0") -e staging                    # Deploy to staging
    $(basename "$0") -e production                 # Deploy to production
    $(basename "$0") -e staging -d                 # Deploy to staging using Docker
    $(basename "$0") -e production -r              # Rollback production
    $(basename "$0") -e staging -s -b              # Deploy without tests and build

EOF
}

# ============================================
# Parse Arguments
# ============================================
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -d|--docker)
            DOCKER_DEPLOY=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK=true
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
    exit 1
fi

# ============================================
# Load Environment Configuration
# ============================================
load_env_config() {
    log_info "Loading configuration for $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        staging)
            DEPLOY_HOST="${STAGING_HOST:-staging.embarks.uk}"
            DEPLOY_USER="${STAGING_USER:-deploy}"
            DEPLOY_PATH="${STAGING_PATH:-/var/www/staging-client-web}"
            ENV_FILE=".env.staging"
            ;;
        production)
            DEPLOY_HOST="${PRODUCTION_HOST:-embarks.uk}"
            DEPLOY_USER="${PRODUCTION_USER:-deploy}"
            DEPLOY_PATH="${PRODUCTION_PATH:-/var/www/client-web}"
            ENV_FILE=".env.production"
            ;;
    esac
    
    log_success "Configuration loaded"
}

# ============================================
# Pre-deployment Checks
# ============================================
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    cd "$PROJECT_DIR"
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18 or higher is required"
        exit 1
    fi
    
    # Check if npm packages are installed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm ci
    fi
    
    log_success "Pre-deployment checks passed"
}

# ============================================
# Run Tests
# ============================================
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping tests"
        return
    fi
    
    log_info "Running tests..."
    
    cd "$PROJECT_DIR"
    
    # Run linting
    log_info "Running ESLint..."
    npm run lint:check
    
    # Run type checking
    log_info "Running TypeScript type check..."
    npm run type-check
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test:run
    
    log_success "All tests passed"
}

# ============================================
# Build Application
# ============================================
build_application() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "Skipping build"
        return
    fi
    
    log_info "Building application for $ENVIRONMENT..."
    
    cd "$PROJECT_DIR"
    
    # Clean previous build
    rm -rf dist
    
    # Copy environment file
    cp "$ENV_FILE" .env.production.local
    
    # Build
    npm run build
    
    # Verify build output
    if [ ! -d "dist" ]; then
        log_error "Build failed: dist directory not found"
        exit 1
    fi
    
    log_success "Build completed successfully"
}

# ============================================
# Create Backup
# ============================================
create_backup() {
    log_info "Creating backup..."
    
    BACKUP_NAME="${APP_NAME}_${ENVIRONMENT}_${TIMESTAMP}"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup current deployment (if exists)
    if [ -d "$DEPLOY_PATH" ]; then
        tar -czf "$BACKUP_PATH.tar.gz" -C "$DEPLOY_PATH" .
        log_success "Backup created: $BACKUP_PATH.tar.gz"
        
        # Keep only last 10 backups
        ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +11 | xargs -r rm
    else
        log_warning "No existing deployment to backup"
    fi
}

# ============================================
# Deploy to Server
# ============================================
deploy_to_server() {
    log_info "Deploying to $ENVIRONMENT server..."
    
    # Create backup before deployment
    create_backup
    
    # Deploy using rsync
    log_info "Syncing files to $DEPLOY_HOST..."
    rsync -avz --delete \
        --exclude='.env' \
        --exclude='node_modules' \
        "$PROJECT_DIR/dist/" \
        "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
    
    log_success "Deployment completed"
}

# ============================================
# Docker Deployment
# ============================================
deploy_docker() {
    log_info "Deploying using Docker..."
    
    cd "$PROJECT_DIR"
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build \
        --build-arg ENV_FILE="$ENV_FILE" \
        -t "$APP_NAME:$VERSION" \
        -t "$APP_NAME:$ENVIRONMENT" \
        .
    
    # Save image for transfer
    log_info "Saving Docker image..."
    docker save "$APP_NAME:$VERSION" | gzip > "${APP_NAME}_${VERSION}.tar.gz"
    
    # Transfer and load on remote server
    log_info "Transferring image to server..."
    scp "${APP_NAME}_${VERSION}.tar.gz" "$DEPLOY_USER@$DEPLOY_HOST:/tmp/"
    
    # Deploy on remote server
    log_info "Deploying on remote server..."
    ssh "$DEPLOY_USER@$DEPLOY_HOST" << EOF
        docker load < /tmp/${APP_NAME}_${VERSION}.tar.gz
        docker stop $APP_NAME-$ENVIRONMENT || true
        docker rm $APP_NAME-$ENVIRONMENT || true
        docker run -d \
            --name $APP_NAME-$ENVIRONMENT \
            --restart unless-stopped \
            -p 8080:8080 \
            $APP_NAME:$VERSION
        rm /tmp/${APP_NAME}_${VERSION}.tar.gz
EOF
    
    # Cleanup local image
    rm "${APP_NAME}_${VERSION}.tar.gz"
    
    log_success "Docker deployment completed"
}

# ============================================
# Rollback
# ============================================
rollback() {
    log_info "Rolling back $ENVIRONMENT deployment..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*"$ENVIRONMENT"*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found for rollback"
        exit 1
    fi
    
    log_info "Restoring from backup: $LATEST_BACKUP"
    
    # Restore backup
    ssh "$DEPLOY_USER@$DEPLOY_HOST" << EOF
        rm -rf ${DEPLOY_PATH}/*
        tar -xzf $LATEST_BACKUP -C $DEPLOY_PATH
EOF
    
    log_success "Rollback completed"
}

# ============================================
# Post-deployment Verification
# ============================================
post_deployment_check() {
    log_info "Running post-deployment checks..."
    
    # Wait for service to be ready
    sleep 5
    
    # Check health endpoint
    HEALTH_URL="https://$DEPLOY_HOST/health"
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_warning "Health check failed, but deployment may still be in progress"
    fi
    
    # Verify main page
    MAIN_URL="https://$DEPLOY_HOST"
    if curl -sf "$MAIN_URL" > /dev/null 2>&1; then
        log_success "Application is accessible"
    else
        log_warning "Application may not be fully ready yet"
    fi
}

# ============================================
# Send Notification
# ============================================
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification (if webhook is configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" > /dev/null 2>&1 || true
    fi
    
    # Print to console
    if [ "$status" = "success" ]; then
        log_success "$message"
    else
        log_error "$message"
    fi
}

# ============================================
# Main Deployment Flow
# ============================================
main() {
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "Timestamp: $TIMESTAMP"
    
    # Load configuration
    load_env_config
    
    # Handle rollback
    if [ "$ROLLBACK" = true ]; then
        rollback
        exit 0
    fi
    
    # Run deployment steps
    pre_deployment_checks
    run_tests
    build_application
    
    if [ "$DOCKER_DEPLOY" = true ]; then
        deploy_docker
    else
        deploy_to_server
    fi
    
    post_deployment_check
    
    # Send success notification
    send_notification "success" "✅ $APP_NAME deployed to $ENVIRONMENT successfully (v$VERSION)"
    
    log_success "Deployment process completed!"
    log_info "Application URL: https://$DEPLOY_HOST"
}

# ============================================
# Error Handler
# ============================================
trap 'log_error "Deployment failed!"; send_notification "error" "❌ $APP_NAME deployment to $ENVIRONMENT failed"; exit 1' ERR

# Run main function
main
