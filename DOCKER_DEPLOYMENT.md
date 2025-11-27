# Docker Deployment Guide

This guide explains how to deploy Splice using Docker, which provides full support for CLI tools (Prism and OpenAPI Generator).

## Prerequisites
- Docker installed (https://docs.docker.com/get-docker/)
- Docker Compose installed (usually comes with Docker Desktop)

## Quick Start

### 1. Build and Run with Docker Compose
```bash
# Build and start the container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The app will be available at `http://localhost:3000`

### 2. Stop the Container
```bash
docker-compose down
```

## Manual Docker Commands

### Build the Image
```bash
docker build -t splice:latest .
```

### Run the Container
```bash
docker run -p 3000:3000 \
  -v /tmp/splice-sdks:/tmp/splice-sdks \
  -v /tmp/splice-specs:/tmp/splice-specs \
  splice:latest
```

## Deployment to Cloud Platforms

### Railway.app (Recommended)
Railway automatically detects and uses the Dockerfile:
1. Connect your GitHub repository
2. Railway will use the Dockerfile automatically
3. No additional configuration needed

### Render.com
1. Create a new Web Service
2. Connect your GitHub repository
3. Select "Docker" as the environment
4. Render will use the Dockerfile automatically

### Fly.io
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Deploy: `fly deploy`

### AWS ECS / Google Cloud Run / Azure Container Instances
1. Build and push to container registry:
   ```bash
   docker build -t your-registry/splice:latest .
   docker push your-registry/splice:latest
   ```
2. Deploy using platform-specific instructions

## Environment Variables

Set these in your deployment platform:

```bash
NODE_ENV=production
PORT=3000
```

## Verifying CLI Tools

After deployment, verify the CLI tools are installed:

```bash
# SSH into container (method varies by platform)
prism --version
openapi-generator-cli version
```

## Troubleshooting

### Build Fails
- Ensure Docker has enough memory (4GB+ recommended)
- Check that `pnpm-lock.yaml` is committed
- Verify all dependencies are in `package.json`

### CLI Tools Not Found
- Check that the global install commands ran successfully in build logs
- Verify Java is installed (required for OpenAPI Generator)

### App Won't Start
- Check logs: `docker logs <container-id>`
- Verify the standalone build was created
- Ensure port 3000 is not already in use

## Performance Optimization

The Dockerfile uses multi-stage builds to:
- ✅ Minimize final image size
- ✅ Cache dependencies for faster rebuilds
- ✅ Run as non-root user for security
- ✅ Include only production dependencies

## Development vs Production

**Development (local):**
```bash
pnpm dev
```

**Production (Docker):**
```bash
docker-compose up
```

## Health Check

The container includes a health check that pings `/api/health` every 30 seconds.

## Volumes

The Docker setup mounts these directories:
- `/tmp/splice-sdks` - Generated SDK files
- `/tmp/splice-specs` - Uploaded OpenAPI specs

These persist between container restarts when using docker-compose.
