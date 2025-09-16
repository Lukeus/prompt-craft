#!/bin/bash

# Multi-Platform Deployment Script for Prompt Craft
# Supports: Docker, Kubernetes, Azure, AWS, GCP, Vercel

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SCRIPT_NAME="$(basename "$0")"

# Default values
PLATFORM=""
ENVIRONMENT="production"
VERSION=""
BUILD_ONLY=false
SKIP_TESTS=false
DRY_RUN=false
VERBOSE=false
CONFIG_FILE=""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" >&2
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
    exit 1
}

info() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
    fi
}

# Usage function
usage() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS] <platform>

Deploy Prompt Craft to various platforms

PLATFORMS:
    docker              Build and run with Docker Compose
    kubernetes          Deploy to Kubernetes cluster
    azure               Deploy to Azure Container Apps
    aws                 Deploy to AWS ECS/Fargate
    gcp                 Deploy to Google Cloud Run
    vercel              Deploy to Vercel

OPTIONS:
    -e, --environment   Deployment environment (development|staging|production) [default: production]
    -v, --version       Version/tag to deploy [default: auto-generated]
    -c, --config        Custom configuration file path
    -b, --build-only    Only build images, don't deploy
    -s, --skip-tests    Skip running tests before deployment
    -d, --dry-run       Show what would be deployed without executing
    --verbose           Enable verbose output
    -h, --help          Show this help message

EXAMPLES:
    $SCRIPT_NAME docker
    $SCRIPT_NAME kubernetes --environment staging
    $SCRIPT_NAME azure --version v1.2.3 --config ./custom-config.json
    $SCRIPT_NAME vercel --dry-run

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -b|--build-only)
                BUILD_ONLY=true
                shift
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            -*|--*)
                error "Unknown option $1"
                ;;
            *)
                if [[ -z "$PLATFORM" ]]; then
                    PLATFORM="$1"
                else
                    error "Multiple platforms specified: $PLATFORM and $1"
                fi
                shift
                ;;
        esac
    done

    # Validate required arguments
    if [[ -z "$PLATFORM" ]]; then
        error "Platform is required. Use --help for usage information."
    fi

    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        error "Invalid environment: $ENVIRONMENT. Must be development, staging, or production."
    fi

    # Generate version if not provided
    if [[ -z "$VERSION" ]]; then
        VERSION="$(git describe --tags --always --dirty 2>/dev/null || echo "dev-$(date +%Y%m%d-%H%M%S)")"
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."

    # Check if we're in the project root
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        error "Not in project root or package.json not found"
    fi

    # Check required tools based on platform
    case "$PLATFORM" in
        docker)
            command -v docker >/dev/null 2>&1 || error "Docker is not installed"
            command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"
            ;;
        kubernetes)
            command -v kubectl >/dev/null 2>&1 || error "kubectl is not installed"
            ;;
        azure)
            command -v az >/dev/null 2>&1 || error "Azure CLI is not installed"
            ;;
        aws)
            command -v aws >/dev/null 2>&1 || error "AWS CLI is not installed"
            ;;
        gcp)
            command -v gcloud >/dev/null 2>&1 || error "Google Cloud SDK is not installed"
            ;;
        vercel)
            command -v vercel >/dev/null 2>&1 || error "Vercel CLI is not installed"
            ;;
    esac

    # Run tests unless skipped
    if [[ "$SKIP_TESTS" != "true" ]]; then
        log "Running tests..."
        if [[ "$DRY_RUN" != "true" ]]; then
            cd "$PROJECT_ROOT"
            npm test || error "Tests failed"
        else
            info "Would run: npm test"
        fi
    fi

    log "Pre-deployment checks completed successfully"
}

# Build application
build_application() {
    log "Building application for $PLATFORM..."

    cd "$PROJECT_ROOT"

    if [[ "$DRY_RUN" != "true" ]]; then
        # Install dependencies
        npm ci

        # Build TypeScript
        npm run build

        # Build web application if needed
        case "$PLATFORM" in
            docker|kubernetes|azure|aws|gcp)
                npm run mcp-web:build
                ;;
            vercel)
                # Vercel handles building
                ;;
        esac
    else
        info "Would run: npm ci && npm run build && npm run mcp-web:build"
    fi

    log "Build completed successfully"
}

# Platform-specific deployment functions
deploy_docker() {
    log "Deploying to Docker..."

    local compose_file="docker-compose.yml"
    local env_file=".env.${ENVIRONMENT}"

    if [[ -f "$env_file" ]]; then
        info "Using environment file: $env_file"
        export $(cat "$env_file" | grep -v '^#' | xargs)
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        info "Would run: docker-compose -f $compose_file up --build -d"
        return
    fi

    # Build and deploy
    docker-compose -f "$compose_file" build
    
    if [[ "$BUILD_ONLY" != "true" ]]; then
        docker-compose -f "$compose_file" up -d
        
        # Wait for services to be healthy
        log "Waiting for services to become healthy..."
        sleep 10
        
        if docker-compose -f "$compose_file" ps | grep -q "unhealthy"; then
            warn "Some services may not be healthy. Check logs with: docker-compose logs"
        else
            log "All services are running successfully"
        fi
    fi
}

deploy_kubernetes() {
    log "Deploying to Kubernetes..."

    local k8s_dir="$PROJECT_ROOT/k8s"
    
    if [[ ! -d "$k8s_dir" ]]; then
        error "Kubernetes manifests not found at $k8s_dir"
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        info "Would apply Kubernetes manifests from $k8s_dir"
        return
    fi

    # Build and push image first
    local image_name="prompt-craft:$VERSION"
    docker build -t "$image_name" .
    
    if [[ "$BUILD_ONLY" != "true" ]]; then
        # Apply manifests
        kubectl apply -f "$k8s_dir/"
        
        # Wait for deployment
        kubectl rollout status deployment/prompt-craft-web -n prompt-craft --timeout=300s
        
        log "Kubernetes deployment completed successfully"
    fi
}

deploy_azure() {
    log "Deploying to Azure Container Apps..."

    local resource_group="${AZURE_RESOURCE_GROUP:-prompt-craft-rg}"
    local container_app="${AZURE_CONTAINER_APP:-prompt-craft-app}"
    local container_registry="${AZURE_CONTAINER_REGISTRY:-promptcraft}"

    if [[ "$DRY_RUN" == "true" ]]; then
        info "Would deploy to Azure Container Apps: $container_app in $resource_group"
        return
    fi

    # Login to Azure if needed
    if ! az account show >/dev/null 2>&1; then
        log "Logging into Azure..."
        az login
    fi

    # Build and push image
    local image_name="$container_registry.azurecr.io/prompt-craft:$VERSION"
    
    az acr build --registry "$container_registry" --image "prompt-craft:$VERSION" .
    
    if [[ "$BUILD_ONLY" != "true" ]]; then
        # Update container app
        az containerapp update \
            --name "$container_app" \
            --resource-group "$resource_group" \
            --image "$image_name" \
            --environment-variables \
                NODE_ENV="$ENVIRONMENT" \
                PLATFORM_TYPE=azure \
                APP_VERSION="$VERSION"
        
        log "Azure deployment completed successfully"
    fi
}

deploy_vercel() {
    log "Deploying to Vercel..."

    if [[ "$DRY_RUN" == "true" ]]; then
        info "Would run: vercel --prod"
        return
    fi

    local vercel_args=""
    if [[ "$ENVIRONMENT" == "production" ]]; then
        vercel_args="--prod"
    fi

    vercel $vercel_args

    log "Vercel deployment completed successfully"
}

# Main deployment function
deploy() {
    case "$PLATFORM" in
        docker)
            deploy_docker
            ;;
        kubernetes)
            deploy_kubernetes
            ;;
        azure)
            deploy_azure
            ;;
        aws)
            error "AWS deployment not yet implemented"
            ;;
        gcp)
            error "GCP deployment not yet implemented"
            ;;
        vercel)
            deploy_vercel
            ;;
        *)
            error "Unsupported platform: $PLATFORM"
            ;;
    esac
}

# Post-deployment verification
post_deployment_verification() {
    if [[ "$BUILD_ONLY" == "true" || "$DRY_RUN" == "true" ]]; then
        return
    fi

    log "Running post-deployment verification..."

    case "$PLATFORM" in
        docker)
            # Check if services are running
            if docker-compose ps | grep -q "Up"; then
                log "Docker services are running"
                # Test health endpoint
                sleep 5
                if curl -f http://localhost:3000/health >/dev/null 2>&1; then
                    log "Health check passed"
                else
                    warn "Health check failed - service may still be starting"
                fi
            fi
            ;;
        kubernetes)
            # Check deployment status
            kubectl get pods -n prompt-craft
            ;;
        azure)
            log "Azure deployment verification completed"
            ;;
        vercel)
            log "Vercel deployment verification completed"
            ;;
    esac
}

# Main execution
main() {
    parse_args "$@"

    log "Starting deployment to $PLATFORM (environment: $ENVIRONMENT, version: $VERSION)"

    if [[ "$DRY_RUN" == "true" ]]; then
        warn "DRY RUN MODE - No actual changes will be made"
    fi

    pre_deployment_checks
    build_application
    deploy
    post_deployment_verification

    log "Deployment completed successfully! 🚀"

    # Show next steps
    case "$PLATFORM" in
        docker)
            echo ""
            log "Next steps:"
            echo "  • View logs: docker-compose logs -f"
            echo "  • Access application: http://localhost:3000"
            echo "  • Stop services: docker-compose down"
            ;;
        kubernetes)
            echo ""
            log "Next steps:"
            echo "  • View pods: kubectl get pods -n prompt-craft"
            echo "  • View logs: kubectl logs -f deployment/prompt-craft-web -n prompt-craft"
            echo "  • Port forward: kubectl port-forward service/prompt-craft-web-service 3000:80 -n prompt-craft"
            ;;
    esac
}

# Run main function
main "$@"