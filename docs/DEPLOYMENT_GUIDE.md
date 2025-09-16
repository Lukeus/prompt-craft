# 🚀 Prompt Craft - Multi-Platform Deployment Guide

This guide covers deploying Prompt Craft to various hosting platforms, from local development to enterprise Kubernetes clusters.

## Table of Contents

- [Quick Start](#quick-start)
- [Platform-Specific Deployments](#platform-specific-deployments)
  - [Docker & Docker Compose](#docker--docker-compose)
  - [Kubernetes](#kubernetes)
  - [Azure](#azure)
  - [AWS](#aws)
  - [Google Cloud Platform](#google-cloud-platform)
  - [Vercel](#vercel)
- [Configuration Management](#configuration-management)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

## Quick Start

The fastest way to deploy Prompt Craft is using our automated deployment script:

```bash
# Make the script executable
chmod +x scripts/deploy.sh

# Deploy to Docker (local development)
./scripts/deploy.sh docker

# Deploy to Kubernetes (staging/production)
./scripts/deploy.sh kubernetes --environment staging

# Deploy to Azure (production)
./scripts/deploy.sh azure --environment production
```

## Platform-Specific Deployments

### Docker & Docker Compose

**Best for:** Local development, small team deployments, testing

#### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

#### Quick Deployment
```bash
# Using deployment script (recommended)
./scripts/deploy.sh docker

# Or manually
docker-compose up --build -d
```

#### Configuration
Create environment-specific `.env` files:

```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@db:5432/prompts
REPOSITORY_TYPE=database
LOG_LEVEL=debug

# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://postgres:secure_password@db:5432/prompts
REPOSITORY_TYPE=database
LOG_LEVEL=info
METRICS_ENABLED=true
```

#### Docker Profiles
Use different service profiles for different use cases:

```bash
# Full stack (default)
docker-compose up -d

# CLI only
docker-compose --profile cli up -d

# With monitoring
docker-compose --profile monitoring up -d

# With caching
docker-compose --profile cache up -d
```

#### Accessing Services
- **Web Interface:** http://localhost:3000
- **Database:** localhost:5432
- **Grafana (if monitoring enabled):** http://localhost:3001
- **Prometheus (if monitoring enabled):** http://localhost:9090

---

### Kubernetes

**Best for:** Production deployments, enterprise environments, auto-scaling

#### Prerequisites
- Kubernetes cluster 1.24+
- kubectl configured
- NGINX Ingress Controller (recommended)
- cert-manager (for SSL certificates)

#### Quick Deployment
```bash
# Deploy everything
kubectl apply -f k8s/

# Or use deployment script
./scripts/deploy.sh kubernetes --environment production
```

#### Step-by-Step Deployment

1. **Create namespace and basic resources:**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   ```

2. **Create secrets (customize first!):**
   ```bash
   # Edit k8s/secrets.yaml with your actual values
   kubectl apply -f k8s/secrets.yaml
   ```

3. **Deploy storage:**
   ```bash
   kubectl apply -f k8s/storage.yaml
   ```

4. **Deploy database:**
   ```bash
   kubectl apply -f k8s/postgres-deployment.yaml
   ```

5. **Deploy application:**
   ```bash
   kubectl apply -f k8s/web-deployment.yaml
   ```

#### Customization for Enterprise

**Resource Limits (Production):**
```yaml
resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 1000m
    memory: 2Gi
```

**High Availability:**
```yaml
replicas: 5
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
    maxSurge: 2
```

**Security Policies:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

#### Azure Kubernetes Service (AKS) Specific

```bash
# Create AKS cluster
az aks create \
  --resource-group prompt-craft-rg \
  --name prompt-craft-aks \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-addons monitoring,http_application_routing \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group prompt-craft-rg --name prompt-craft-aks

# Deploy
./scripts/deploy.sh kubernetes
```

---

### Azure

**Best for:** Microsoft-centric organizations, enterprise compliance, integrated monitoring

#### Prerequisites
- Azure CLI 2.50+
- Azure subscription
- Resource group created

#### Container Apps Deployment

```bash
# Using deployment script
./scripts/deploy.sh azure

# Or manually:

# Create container registry
az acr create --resource-group prompt-craft-rg --name promptcraftregistry --sku Basic

# Create container app environment
az containerapp env create \
  --name prompt-craft-env \
  --resource-group prompt-craft-rg \
  --location "East US 2"

# Create container app
az containerapp create \
  --name prompt-craft-app \
  --resource-group prompt-craft-rg \
  --environment prompt-craft-env \
  --image promptcraftregistry.azurecr.io/prompt-craft:latest \
  --target-port 3000 \
  --ingress external \
  --min-replicas 2 \
  --max-replicas 10
```

#### Azure SQL Database Setup

```bash
# Create Azure SQL Server
az sql server create \
  --name prompt-craft-sql \
  --resource-group prompt-craft-rg \
  --location "East US 2" \
  --admin-user promptadmin \
  --admin-password YourSecurePassword123!

# Create database
az sql db create \
  --resource-group prompt-craft-rg \
  --server prompt-craft-sql \
  --name prompts \
  --service-objective Basic
```

#### Environment Variables for Azure
```bash
export AZURE_RESOURCE_GROUP="prompt-craft-rg"
export AZURE_CONTAINER_REGISTRY="promptcraftregistry"
export AZURE_CONTAINER_APP="prompt-craft-app"
export DATABASE_URL="Server=prompt-craft-sql.database.windows.net;Database=prompts;User Id=promptadmin;Password=YourSecurePassword123!;Encrypt=true;"
```

---

### AWS

**Best for:** AWS-native organizations, microservices architecture

#### ECS/Fargate Deployment

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name prompt-craft-cluster

# Create task definition
aws ecs register-task-definition --cli-input-json file://aws/task-definition.json

# Create service
aws ecs create-service \
  --cluster prompt-craft-cluster \
  --service-name prompt-craft-service \
  --task-definition prompt-craft:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

#### RDS Database Setup

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier prompt-craft-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username promptuser \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-12345
```

---

### Google Cloud Platform

**Best for:** GCP-native organizations, serverless deployments

#### Cloud Run Deployment

```bash
# Build and push image
gcloud builds submit --tag gcr.io/your-project/prompt-craft

# Deploy to Cloud Run
gcloud run deploy prompt-craft \
  --image gcr.io/your-project/prompt-craft \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10
```

#### Cloud SQL Setup

```bash
# Create Cloud SQL instance
gcloud sql instances create prompt-craft-db \
  --database-version POSTGRES_14 \
  --tier db-f1-micro \
  --region us-central1

# Create database
gcloud sql databases create prompts --instance prompt-craft-db
```

---

### Vercel

**Best for:** Frontend-heavy deployments, edge computing, rapid prototyping

#### Prerequisites
- Vercel CLI installed
- Vercel account

#### Deployment

```bash
# Using deployment script
./scripts/deploy.sh vercel

# Or manually
vercel --prod
```

#### Configuration
Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "packages/apps/web/**/*.astro",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist-web"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database_url"
  }
}
```

## Configuration Management

### Environment-Specific Configuration

Create configuration files for each environment:

```javascript
// config/development.json
{
  "database": {
    "connectionLimit": 5,
    "timeout": 30000
  },
  "logging": {
    "level": "debug"
  }
}

// config/production.json
{
  "database": {
    "connectionLimit": 50,
    "timeout": 60000,
    "ssl": true
  },
  "logging": {
    "level": "info",
    "destination": "file"
  },
  "security": {
    "helmet": {
      "enabled": true
    }
  }
}
```

### Platform-Specific Configuration

Each platform can have its own configuration overrides:

```javascript
// config/platforms/kubernetes.json
{
  "server": {
    "trustProxy": true
  },
  "logging": {
    "destination": "console",
    "format": "json"
  }
}

// config/platforms/azure.json
{
  "database": {
    "type": "azure-sql",
    "authentication": "ActiveDirectoryPassword"
  },
  "logging": {
    "destination": "azure-insights"
  }
}
```

## Environment Variables

### Core Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/staging/production) | `development` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |
| `DATABASE_URL` | Database connection string | - |
| `REPOSITORY_TYPE` | Storage type (filesystem/database) | `filesystem` |

### Database Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_TYPE` | Database type (postgresql/mysql/azure-sql) | `postgresql` |
| `DATABASE_HOST` | Database host | `localhost` |
| `DATABASE_PORT` | Database port | `5432` |
| `DATABASE_NAME` | Database name | `prompts` |
| `DATABASE_SSL` | Enable SSL | `false` |

### Security Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret | - |
| `ENCRYPTION_KEY` | Encryption key for sensitive data | - |
| `AUTH_ENABLED` | Enable authentication | `false` |
| `AUTH_PROVIDER` | Authentication provider | `none` |

### Platform Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PLATFORM_TYPE` | Platform type | `docker` |
| `KUBERNETES_NAMESPACE` | K8s namespace | `default` |
| `AZURE_RESOURCE_GROUP` | Azure resource group | - |

## Database Setup

### PostgreSQL (Recommended)

```sql
-- Create database
CREATE DATABASE prompts;

-- Create user
CREATE USER prompt_craft_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE prompts TO prompt_craft_user;

-- Connect to database and create extensions
\c prompts;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Migration Commands

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Reset database (careful in production!)
npm run db:reset
```

### Backup and Restore

```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

## Monitoring & Health Checks

### Health Check Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/health` | General health status | JSON with status and checks |
| `/health/ready` | Readiness probe | JSON with readiness status |
| `/health/live` | Liveness probe | Simple alive status |
| `/metrics` | Prometheus metrics | Prometheus format metrics |

### Monitoring Setup

#### Prometheus Configuration

```yaml
# config/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prompt-craft'
    static_configs:
      - targets: ['prompt-craft-web:3000']
    metrics_path: /metrics
    scrape_interval: 30s
```

#### Grafana Dashboards

Import our pre-built dashboard from `config/grafana/dashboards/prompt-craft.json`.

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Test database connection
npm run db:migrate -- --dry-run

# Check database logs
docker-compose logs db

# Verify environment variables
echo $DATABASE_URL
```

#### Memory Issues
```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

#### SSL/TLS Issues
```bash
# Test SSL connection
openssl s_client -connect your-domain.com:443

# Check certificate
kubectl describe secret prompt-craft-tls -n prompt-craft
```

### Debugging

#### Enable Debug Logging
```bash
export LOG_LEVEL=debug
export DEBUG=prompt-craft:*
```

#### View Logs

**Docker:**
```bash
docker-compose logs -f prompt-craft-web
```

**Kubernetes:**
```bash
kubectl logs -f deployment/prompt-craft-web -n prompt-craft
```

**Azure:**
```bash
az containerapp logs show --name prompt-craft-app --resource-group prompt-craft-rg
```

### Performance Tuning

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY idx_prompts_category ON prompts(category);
CREATE INDEX CONCURRENTLY idx_prompts_tags_gin ON prompts USING GIN(tags);
CREATE INDEX CONCURRENTLY idx_prompts_search ON prompts USING GIN(to_tsvector('english', name || ' ' || description || ' ' || content));
```

#### Application Optimization
```javascript
// Increase connection pool size for high-traffic
DATABASE_CONNECTION_LIMIT=50
DATABASE_POOL_MAX=50

// Enable caching
FEATURE_CACHING=true
REDIS_URL=redis://localhost:6379
```

### Security Best Practices

1. **Use secrets management:**
   ```bash
   # Kubernetes
   kubectl create secret generic prompt-craft-secrets --from-literal=database-password=xyz
   
   # Azure
   az keyvault secret set --vault-name prompt-craft-kv --name database-password --value xyz
   ```

2. **Enable authentication:**
   ```bash
   export AUTH_ENABLED=true
   export AUTH_PROVIDER=azure-ad
   export AZURE_TENANT_ID=your-tenant-id
   ```

3. **Use SSL in production:**
   ```bash
   export DATABASE_SSL=true
   export HELMET_ENABLED=true
   ```

4. **Implement network policies:**
   ```yaml
   # k8s/network-policy.yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: prompt-craft-network-policy
   spec:
     podSelector:
       matchLabels:
         app.kubernetes.io/name: prompt-craft
     ingress:
     - from:
       - namespaceSelector:
           matchLabels:
             name: ingress-system
   ```

## Support

For additional support:

1. **Check the logs** using the debugging commands above
2. **Review configuration** with `npm run config:validate`
3. **Test health endpoints** to identify specific issues
4. **Open an issue** with detailed logs and configuration

---

**Happy Deploying! 🚀**

For the latest updates and examples, visit our [GitHub repository](https://github.com/your-org/prompt-craft).