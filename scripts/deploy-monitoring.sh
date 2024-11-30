#!/bin/bash
set -e

# Configuration
PROJECT_ID=$1
ENVIRONMENT=$2
REGION=${3:-us-central1}
SERVICE_NAME="monitoring-service"

# Validate inputs
if [ -z "$PROJECT_ID" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Usage: $0 <project-id> <environment> [region]"
    exit 1
fi

# Set GCP project
gcloud config set project $PROJECT_ID

# Build and tag container
echo "Building container image..."
TAG="gcr.io/$PROJECT_ID/$SERVICE_NAME:$(git rev-parse --short HEAD)"
docker build -t $TAG -f Dockerfile.monitoring .

# Push to Container Registry
echo "Pushing image to Container Registry..."
docker push $TAG

# Initialize Terraform
echo "Initializing Terraform..."
cd infrastructure/monitoring
terraform init

# Apply Terraform configuration
echo "Applying Terraform configuration..."
terraform apply \
    -var="project_id=$PROJECT_ID" \
    -var="environment=$ENVIRONMENT" \
    -var="region=$REGION" \
    -var="container_image=$TAG" \
    -auto-approve

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
gcloud run services wait $SERVICE_NAME --region $REGION

# Verify deployment
echo "Verifying deployment..."
ENDPOINT=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT/health)

if [ $HTTP_STATUS -eq 200 ]; then
    echo "Deployment successful! Service URL: $ENDPOINT"
else
    echo "Deployment verification failed! HTTP Status: $HTTP_STATUS"
    exit 1
fi

# Configure monitoring
echo "Configuring monitoring alerts..."
gcloud monitoring channels create \
    --display-name="$ENVIRONMENT-alerts" \
    --type=email \
    --email-address="alerts@hexproperty.com"

echo "Setting up log exports..."
gcloud logging sinks create monitoring-logs \
    storage.googleapis.com/$PROJECT_ID-monitoring-data \
    --log-filter="resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME"

echo "Deployment complete!"
