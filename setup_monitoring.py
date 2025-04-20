import json
import boto3


def setup_cloudwatch_dashboard():
    cloudwatch = boto3.client("cloudwatch")

    dashboard = {
        "widgets": [
            # Service Health Widget
            {
                "type": "metric",
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["VideoStreaming", "CPUUtilization"],
                        ["VideoStreaming", "MemoryUtilization"],
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": "us-east-1",
                    "title": "Service Health",
                },
            },
            # Application Health Widget
            {
                "type": "metric",
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/ApplicationELB", "HealthyHostCount"],
                        ["AWS/ApplicationELB", "UnHealthyHostCount"],
                        ["AWS/ApplicationELB", "RequestCount"],
                        ["AWS/ApplicationELB", "TargetResponseTime"],
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": "us-east-1",
                    "title": "Application Health",
                },
            },
            # Network Health Widget
            {
                "type": "metric",
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/NetworkELB", "ActiveFlowCount"],
                        ["AWS/NetworkELB", "ProcessedBytes"],
                        ["AWS/NetworkELB", "TCP_Client_Reset_Count"],
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": "us-east-1",
                    "title": "Network Health",
                },
            },
            # API Performance Widget
            {
                "type": "metric",
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["API-Gateway", "Count", "ApiName", "VideoStreamingAPI"],
                        ["API-Gateway", "4XXError", "ApiName", "VideoStreamingAPI"],
                        ["API-Gateway", "5XXError", "ApiName", "VideoStreamingAPI"],
                        ["API-Gateway", "Latency", "ApiName", "VideoStreamingAPI"],
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": "us-east-1",
                    "title": "API Performance",
                },
            },
            # Security Metrics Widget
            {
                "type": "metric",
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/WAF", "BlockedRequests"],
                        ["AWS/WAF", "AllowedRequests"],
                        ["AWS/WAF", "CountedRequests"],
                    ],
                    "period": 300,
                    "stat": "Sum",
                    "region": "us-east-1",
                    "title": "Security Metrics",
                },
            },
            # Service Availability Widget
            {
                "type": "metric",
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/ApiGateway", "5XXError", "ApiName", "VideoStreamingAPI"],
                        ["AWS/ApiGateway", "4XXError", "ApiName", "VideoStreamingAPI"],
                        [
                            "AWS/S3",
                            "5xxErrors",
                            "BucketName",
                            "education-video-streaming-devops-project-s3",
                        ],
                        [
                            "AWS/S3",
                            "4xxErrors",
                            "BucketName",
                            "education-video-streaming-devops-project-s3",
                        ],
                    ],
                    "period": 300,
                    "stat": "Sum",
                    "region": "us-east-1",
                    "title": "Service Availability",
                },
            },
            # S3 Storage Widget
            {
                "type": "metric",
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        [
                            "AWS/S3",
                            "BucketSizeBytes",
                            "BucketName",
                            "education-video-streaming-devops-project-s3",
                        ],
                        [
                            "AWS/S3",
                            "NumberOfObjects",
                            "BucketName",
                            "education-video-streaming-devops-project-s3",
                        ],
                        [
                            "AWS/S3",
                            "AllRequests",
                            "BucketName",
                            "education-video-streaming-devops-project-s3",
                        ],
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": "us-east-1",
                    "title": "S3 Storage Metrics",
                },
            },
            # Custom Application Metrics
            {
                "type": "metric",
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["VideoStreaming", "ActiveUsers"],
                        ["VideoStreaming", "VideoUploads"],
                        ["VideoStreaming", "VideoStreams"],
                        ["VideoStreaming", "APILatency"],
                    ],
                    "period": 300,
                    "stat": "Average",
                    "region": "us-east-1",
                    "title": "Application Metrics",
                },
            },
            # Cost Widget
            {
                "type": "metric",
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/Billing", "EstimatedCharges", "Currency", "USD"],
                    ],
                    "period": 21600,
                    "stat": "Maximum",
                    "region": "us-east-1",
                    "title": "Estimated AWS Charges",
                },
            },
        ]
    }

    cloudwatch.put_dashboard(
        DashboardName="VideoStreamingDashboard", DashboardBody=json.dumps(dashboard)
    )


if __name__ == "__main__":
    setup_cloudwatch_dashboard()
