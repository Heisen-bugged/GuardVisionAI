#!/bin/bash
set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"

echo "Setting up GCP Infrastructure for project: $PROJECT_ID"

# 1. Enable APIs
echo "Enabling required APIs..."
gcloud services enable \
  storage.googleapis.com \
  pubsub.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  videointelligence.googleapis.com \
  compute.googleapis.com

# 2. Create GCS Bucket
BUCKET_NAME="daps-media-${PROJECT_ID}"
echo "Creating GCS Bucket: gs://$BUCKET_NAME"
if ! gcloud storage ls "gs://$BUCKET_NAME" > /dev/null 2>&1; then
  gcloud storage buckets create "gs://$BUCKET_NAME" --location="$REGION"
  gcloud storage buckets update "gs://$BUCKET_NAME" --uniform-bucket-level-access
  echo "Bucket created successfully."
else
  echo "Bucket already exists."
fi

# 3. Create Pub/Sub Topics
echo "Creating Pub/Sub Topics..."
TOPICS=("asset-uploaded-topic" "video-processing-complete-topic")

for TOPIC in "${TOPICS[@]}"; do
  if ! gcloud pubsub topics describe "$TOPIC" > /dev/null 2>&1; then
    gcloud pubsub topics create "$TOPIC"
    echo "Created topic: $TOPIC"
  else
    echo "Topic $TOPIC already exists."
  fi
done

echo "GCP Infrastructure Setup Complete."
echo "Media Bucket: $BUCKET_NAME"
