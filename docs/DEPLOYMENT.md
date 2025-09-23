# 🚀 Deployment Guide for Prompt Craft

## Quick Deploy Options

### 1. Vercel (Recommended) - FREE ⭐

**Why Vercel?**
- Perfect Astro integration
- 100GB bandwidth free
- Global CDN
- Automatic HTTPS
- Git deployments

**Deploy Steps:**
```bash
# 1. Install Vercel CLI (already done)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel --prod

# 4. Your app will be live at: https://your-app.vercel.app
```

**Or use the Vercel Dashboard:**
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Choose your repo
4. Deploy automatically!

### 2. Netlify - FREE

**Deploy Steps:**
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repo
3. Build command: `npm run build:all`
4. Publish directory: `dist`
5. Deploy!

### 3. Railway - FREE (limited)

**Deploy Steps:**
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy
railway up
```

## Environment Variables

If you need environment variables, set these in your hosting platform:

```env
# Optional: Custom port (Vercel handles automatically)
PORT=3000

# Optional: Node environment
NODE_ENV=production
```

## Domain Setup

### Free Custom Domain Options:
1. **Vercel**: Connect any domain for free
2. **Netlify**: Connect custom domains on free tier
3. **Railway**: Custom domains on paid plans only

### DNS Setup:
Point your domain to your hosting platform:
- **Vercel**: Add CNAME record pointing to `cname.vercel-dns.com`
- **Netlify**: Follow their domain setup guide

## Performance Optimization

Your app is already optimized with:
- ✅ Static asset optimization
- ✅ Code splitting
- ✅ Image optimization
- ✅ Minification
- ✅ Compression

## Monitoring

**Vercel Analytics** (included in config):
- Real-time visitor analytics
- Performance insights
- Core Web Vitals tracking

## Troubleshooting

### Common Issues:

1. **Build fails**: Check Node.js version (requires >=20.0.0)
2. **API routes not working**: Ensure Vercel functions are properly configured
3. **Static assets missing**: Check build output directory

### Support:
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Netlify: [docs.netlify.com](https://docs.netlify.com)
- Railway: [docs.railway.app](https://docs.railway.app)

---

**Recommended**: Use Vercel for the best experience with your Astro app! 🎉