# 📚 Prompt Craft Documentation

Welcome to the comprehensive documentation for **Prompt Craft** - a production-ready, enterprise-grade TypeScript prompt management system.

## 📖 **Quick Navigation**

### **Getting Started**
- **[Main README](../README.md)** - Project overview and quick start
- **[WARP Development Guide](../WARP.md)** - Complete development reference

### **Deployment & Operations** 🚀
- **[Complete Deployment Guide](DEPLOYMENT_GUIDE.md)** - Multi-platform deployment instructions
  - Docker & Docker Compose
  - Kubernetes (production)
  - Azure Container Apps
  - AWS ECS/Fargate  
  - Google Cloud Run
  - Vercel (serverless)
- **[Legacy Deployment](DEPLOYMENT.md)** - Simple Vercel deployment
- **[Deployment Rules](DEPLOYMENT_RULE.md)** - Deployment policies and guidelines

### **Technical Deep Dives** 🔧
- **[MCP Web Server](MCP_WEB_SERVER.md)** - HTTP/WebSocket MCP protocol implementation
- **[Client-Side Filtering](CLIENT_SIDE_FILTERING.md)** - Performance improvements and UI enhancements

## 🏗️ **Architecture Overview**

```
Prompt Craft System Architecture
├── 🧠 Domain Layer (Business Logic)
│   ├── Entities (Prompt, PromptVariable)
│   └── Use Cases (PromptUseCases)
├── 🔧 Infrastructure Layer (Data & External)
│   ├── FileSystemPromptRepository
│   ├── DrizzlePromptRepository (PostgreSQL)
│   └── Configuration Management
├── 🚀 Application Layer (Interfaces)
│   ├── CLI (Command Line Interface)
│   ├── MCP Server (stdio & HTTP/WS)
│   └── Web Interface (Astro + TypeScript)
└── 🌐 Deployment Layer (Platform)
    ├── Docker & Kubernetes
    ├── Azure Container Apps
    └── Multi-cloud support
```

## 📋 **Feature Matrix**

| Feature | Local Dev | Docker | Kubernetes | Azure | Vercel |
|---------|-----------|--------|------------|-------|---------|
| **Web Interface** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CLI Access** | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| **MCP Protocol** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Database Storage** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Authentication** | ⚠️ | ⚠️ | ✅ | ✅ | ⚠️ |
| **Auto-scaling** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Health Checks** | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Monitoring** | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |

**Legend:** ✅ Full Support | ⚠️ Partial/Optional | ❌ Not Available

## 🛠️ **Development Workflows**

### **Local Development**
1. Clone repository
2. `npm install`
3. `npm run build`
4. Choose your interface:
   - CLI: `npm start -- help`
   - Web: `npm run mcp-web:dev`

### **Testing**
```bash
npm test              # Full test suite
npm run test:unit     # Unit tests only
npm run lint          # TypeScript checking
```

### **Database Development**
```bash
npm run db:migrate    # Apply migrations
npm run db:seed       # Import sample data
npm run db:studio     # Open database GUI
```

### **Production Deployment**
```bash
# Choose your platform
./scripts/deploy.sh docker
./scripts/deploy.sh kubernetes --environment production
./scripts/deploy.sh azure --environment production
```

## 🔧 **Configuration Guide**

### **Environment Variables**
```bash
# Core Configuration
NODE_ENV=production
PLATFORM_TYPE=kubernetes
REPOSITORY_TYPE=database

# Database
DATABASE_URL=postgresql://...
DATABASE_TYPE=postgresql

# Features
FEATURE_WEB=true
FEATURE_MCP=true  
FEATURE_AUTH=true
FEATURE_MONITORING=true

# Security (for enterprise deployments)
AUTH_PROVIDER=azure-ad
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
```

## 📊 **Monitoring & Health**

### **Health Endpoints**
- `/health` - Overall system health
- `/health/ready` - Readiness probe (K8s)
- `/health/live` - Liveness probe (K8s)
- `/metrics` - Prometheus metrics

### **Monitoring Stack**
- **Prometheus** - Metrics collection
- **Grafana** - Visualization dashboards
- **Azure Application Insights** - Azure deployments
- **Health checks** - Automatic failure detection

## 🔒 **Security Features**

### **Authentication Options**
- **Azure Active Directory** - Enterprise SSO
- **OAuth2** - Standard OAuth providers
- **LDAP** - Corporate directories
- **None** - Development/open access

### **Security Headers**
- Content Security Policy (CSP)
- HTTPS enforcement
- CORS configuration
- Rate limiting

## 🆘 **Support & Troubleshooting**

### **Common Issues**
1. **Database connection errors** - Check `DATABASE_URL` and network access
2. **Build failures** - Ensure Node.js 20+ and clean build (`npm run clean`)
3. **Memory issues** - Increase container memory limits
4. **Permission errors** - Check file permissions and user contexts

### **Getting Help**
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - This comprehensive guide
- **WARP.md** - Development-specific guidance
- **Health endpoints** - Real-time system status

## 🗺️ **Roadmap**

### **Completed** ✅
- Multi-platform deployment
- Enterprise authentication
- Health checks and monitoring
- Database abstraction
- MCP protocol implementation

### **In Progress** 🚧
- Real-time collaboration
- Advanced analytics
- Plugin system

### **Planned** 📋
- Mobile application
- Advanced caching
- Multi-language support

---

**Happy building with Prompt Craft!** 🚀

For the most up-to-date information, always refer to the main [README](../README.md) and [WARP.md](../WARP.md) files.