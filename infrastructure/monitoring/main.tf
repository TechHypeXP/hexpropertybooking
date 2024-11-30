terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
  backend "gcs" {
    bucket = "hexpropertybooking-terraform-state"
    prefix = "monitoring"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud Run service for monitoring
resource "google_cloud_run_service" "monitoring" {
  name     = "monitoring-service"
  location = var.region

  template {
    spec {
      containers {
        image = var.container_image
        
        env {
          name  = "NODE_ENV"
          value = var.environment
        }
        
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }
        
        env {
          name = "PROMETHEUS_ENDPOINT"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.prometheus_endpoint.secret_id
              key  = "latest"
            }
          }
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Monitoring bucket for logs and metrics
resource "google_storage_bucket" "monitoring_data" {
  name          = "${var.project_id}-monitoring-data"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}

# Pub/Sub topic for monitoring alerts
resource "google_pubsub_topic" "monitoring_alerts" {
  name = "monitoring-alerts"
}

# Secret for Prometheus endpoint
resource "google_secret_manager_secret" "prometheus_endpoint" {
  secret_id = "prometheus-endpoint"
  
  replication {
    automatic = true
  }
}

# IAM for monitoring service
resource "google_service_account" "monitoring" {
  account_id   = "monitoring-service"
  display_name = "Monitoring Service Account"
}

resource "google_project_iam_member" "monitoring_metrics" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.monitoring.email}"
}

resource "google_project_iam_member" "monitoring_logs" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.monitoring.email}"
}

# Monitoring dashboard
resource "google_monitoring_dashboard" "monitoring" {
  dashboard_json = jsonencode({
    displayName = "Monitoring System Dashboard"
    gridLayout = {
      widgets = [
        {
          title = "System Health"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"custom.googleapis.com/monitoring/health_status\""
                }
              }
            }]
          }
        },
        {
          title = "Alert Count"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"custom.googleapis.com/monitoring/active_alerts\""
                }
              }
            }]
          }
        }
      ]
    }
  })
}
