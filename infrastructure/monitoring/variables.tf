variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "The deployment environment (staging/production)"
  type        = string
}

variable "container_image" {
  description = "The container image to deploy"
  type        = string
}

variable "monitoring_retention_days" {
  description = "Number of days to retain monitoring data"
  type        = number
  default     = 90
}

variable "alert_notification_channel" {
  description = "The notification channel for alerts"
  type        = string
  default     = "email"
}
