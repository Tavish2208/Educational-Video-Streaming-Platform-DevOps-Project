# Educational Video Streaming Platform with Microservices architecture and full CI/CD Pipeline

## Overview

This project is an educational video streaming system that allows users to authenticate, stream videos, and manage their watchlists. It utilizes React for the frontend, Flask microservices for the backend, and MongoDB for data storage, with cloud services provided by Amazon S3 and EC2.

## Features

- User authentication (login and registration)
- Video streaming capabilities
- Watchlist management for users
- Admin panel for video upload and metadata management
- Responsive design for various devices

## Technologies Used

- **Frontend:** React, TypeScript
- **Backend:** Flask, Python
- **Database:** MongoDB
- **Cloud Services:** Amazon S3, Amazon EC2
- **Containerization:** Docker
- **CI/CD:** GitLab CI/CD
- **Load Balancing:** HAProxy

## Project Structure

- **frontend/**: Contains the React application.
- **backend/**: Contains Flask microservices for authentication, video streaming, and watchlist management.
  - **auth_service/**: Handles user authentication.
  - **video_service/**: Manages video streaming and metadata.
  - **watchlist_service/**: Manages user watchlists.
- **infrastructure/**: Contains setup scripts for AWS services and CI/CD configurations.
- **docker-compose.yml**: Docker Compose configuration for local development.
- **remote.docker-compose.yml**: Docker Compose configuration for remote deployment.
- **haproxy.cfg**: HAProxy configuration for load balancing.

## Architecture

The system follows a microservices architecture, with each service encapsulated in its own Docker container. The services communicate with each other over HTTP and are load-balanced using HAProxy. The architecture is designed to be scalable and resilient, leveraging AWS services for storage and deployment.

### Frontend

The frontend is built with React and TypeScript, providing a responsive user interface for video streaming, authentication, and watchlist management. It communicates with the backend services via RESTful APIs.

### Backend

The backend consists of three Flask microservices:

1. **Auth Service**: Manages user authentication, including login, registration, and token management.
2. **Video Service**: Handles video streaming, metadata management, and video uploads to Amazon S3.
3. **Watchlist Service**: Manages user watchlists, allowing users to add and remove videos from their watchlists.

### Database

MongoDB is used as the primary database for storing user information, video metadata, and watchlist data. Each microservice connects to the MongoDB instance to perform CRUD operations.

### Cloud Services

- **Amazon S3**: Used for storing video files and serving them to users.
- **Amazon EC2**: Hosts the Docker containers for the microservices and frontend application.

### CI/CD

GitLab CI/CD is used for continuous integration and deployment. The `.gitlab-ci.yml` file defines the CI/CD pipeline, which includes stages for testing, building, deploying, and monitoring the application.

### Load Balancing & Reverse Proxy

HAProxy serves as both a load balancer and reverse proxy, handling traffic routing between containerized microservices:

#### Container Routing

- **Frontend Container**: `frontend:8080`

  - Serves as default backend
  - Handles all non-API requests
  - Container name: `frontend`

- **Auth Service Container**: `auth_service:5000`

  - Routes `/auth-backend/*` requests
  - Handles authentication & user management
  - Container name: `auth_service`

- **Video Service Container**: `video_service:5001`

  - Routes `/videos-backend/*` requests
  - Manages video streaming & metadata
  - Container name: `video_service`

- **Watchlist Service Container**: `watchlist_service:5002`
  - Routes `/watchlist-backend/*` requests
  - Manages user watchlists
  - Container name: `watchlist_service`

#### Path Rewriting

HAProxy rewrites incoming paths before forwarding:

- `/auth-backend/login` → `auth_service:5000/login`
- `/videos-backend/stream` → `video_service:5001/stream`
- `/watchlist-backend/add` → `watchlist_service:5002/add`

#### Inter-Container Communication

- Containers communicate via Docker network `app_network`
- HAProxy routes based on container DNS names
- Internal ports are not exposed outside Docker network
- Only HAProxy port 80 is exposed externally

#### Security Features

- Handles CORS and preflight requests
- Single entry point (port 80) for all services
- Internal services not directly accessible
- Path-based routing with clean URLs

The routing configuration and container networking is defined in [haproxy.cfg](haproxy.cfg) and managed by Docker Compose.

## Setup Instructions

1. Clone the repository.
2. Navigate to the `frontend` directory and run `npm install` to install dependencies.
3. Navigate to the `backend` directory and set up a virtual environment, then install dependencies from `requirements.txt`.
4. Configure AWS credentials for S3 and EC2. 5. Run the backend services using Docker with `docker-compose up`. 6. Start the frontend application with `npm start`.

## Deployment

To deploy the application to a remote server, follow these steps:

1. Ensure the remote server has Docker and Docker Compose installed.
2. Copy the`remote.docker-compose.yml` file to the remote server. 3. Configure the environment variables in the `.env` file. 4. Run the following commands on the remote server:

```sh
docker-compose -f remote.docker-compose.yml up -d
```

## Monitoring

The `setup_monitoring.py` script sets up a CloudWatch dashboard for monitoring the application's health and performance. It includes widgets for service health, application health, network health, API performance, security metrics, service availability, S3 storage metrics, custom application metrics, and estimated AWS charges.

## License

This project is licensed under the MIT License.
