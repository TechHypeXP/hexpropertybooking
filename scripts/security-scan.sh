#!/bin/bash
set -e

# Configuration
IMAGE_NAME=$1
SEVERITY_THRESHOLD=${2:-MEDIUM}

# Validate inputs
if [ -z "$IMAGE_NAME" ]; then
    echo "Usage: $0 <image-name> [severity-threshold]"
    exit 1
fi

# Install security tools if not present
command -v trivy >/dev/null 2>&1 || {
    echo "Installing Trivy..."
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
}

# Scan dependencies
echo "Scanning npm dependencies..."
npm audit --audit-level=$SEVERITY_THRESHOLD

# Scan container image
echo "Scanning container image..."
trivy image \
    --severity $SEVERITY_THRESHOLD,HIGH,CRITICAL \
    --exit-code 1 \
    $IMAGE_NAME

# Scan infrastructure code
echo "Scanning Terraform code..."
tfsec infrastructure/monitoring

# SAST scanning
echo "Running static analysis..."
npm run lint

# Check for secrets
echo "Checking for secrets..."
git secrets --scan

echo "Security scan complete!"
