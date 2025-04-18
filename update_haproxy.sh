#!/bin/bash

# Start containers if not running
echo "Starting containers..."
docker-compose up -d

# Wait for containers to start
echo "Waiting for containers to start..."
sleep 10

# Get container IPs directly from network inspect
FRONTEND_IP=$(docker network inspect ec2-user_app_network -f '{{range .Containers}}{{if eq .Name "frontend"}}{{.IPv4Address}}{{end}}{{end}}' | cut -d'/' -f1)   
AUTH_IP=$(docker network inspect ec2-user_app_network -f '{{range .Containers}}{{if eq .Name "auth_service"}}{{.IPv4Address}}{{end}}{{end}}' | cut -d'/' -f1)   
VIDEO_IP=$(docker network inspect ec2-user_app_network -f '{{range .Containers}}{{if eq .Name "video_service"}}{{.IPv4Address}}{{end}}{{end}}' | cut -d'/' -f1) 
WATCHLIST_IP=$(docker network inspect ec2-user_app_network -f '{{range .Containers}}{{if eq .Name "watchlist_service"}}{{.IPv4Address}}{{end}}{{end}}' | cut -d'/' -f1)

# Verify IPs were found
if [ -z "$FRONTEND_IP" ] || [ -z "$AUTH_IP" ] || [ -z "$VIDEO_IP" ] || [ -z "$WATCHLIST_IP" ]; then
    echo "Error: Could not get container IPs"
    exit 1
fi

echo "Container IPs found:"
echo "Frontend: $FRONTEND_IP"
echo "Auth: $AUTH_IP"
echo "Video: $VIDEO_IP"
echo "Watchlist: $WATCHLIST_IP"

# Create HAProxy config with container IPs
cat > /etc/haproxy/haproxy.cfg << EOF
global
    log /dev/log local0
    log /dev/log local1 notice
    maxconn 2000
    user haproxy
    group haproxy
    daemon

defaults
    log     global
    mode    http
    option  httplog
    timeout connect 5000ms
    timeout client  50000ms
    timeout server  50000ms

frontend http_front
    bind *:80
    mode http

    # CORS Headers
    http-response set-header Access-Control-Allow-Origin "*"
    http-response set-header Access-Control-Allow-Headers "*"
    http-response set-header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"

    # Pre-flight
    acl preflight method OPTIONS
    http-request return status 204 if preflight

    # Routes
    acl is_auth path_beg /auth-backend
    acl is_videos path_beg /videos-backend
    acl is_watchlist path_beg /watchlist-backend

    use_backend auth_backend if is_auth
    use_backend videos_backend if is_videos
    use_backend watchlist_backend if is_watchlist
    default_backend frontend_backend

backend frontend_backend
    mode http
    server frontend ${FRONTEND_IP}:8080 check

backend auth_backend
    mode http
    http-request replace-path /auth-backend/(.*) /\1
    server auth ${AUTH_IP}:5000 check

backend videos_backend
    mode http
    http-request replace-path /videos-backend/(.*) /\1
    server videos ${VIDEO_IP}:5001 check

backend watchlist_backend
    mode http
    http-request replace-path /watchlist-backend/(.*) /\1
    server watchlist ${WATCHLIST_IP}:5002 check
EOF

# Restart HAProxy
sudo haproxy -c -f /etc/haproxy/haproxy.cfg && sudo systemctl restart haproxy