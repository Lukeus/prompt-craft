# 🚀 Electron App Release Setup Guide

This guide covers everything needed to set up automated GitHub releases for the Prompt Craft Electron desktop application.

## 📋 Overview

The release automation system provides:
- **Cross-platform builds** (macOS, Windows, Linux)
- **Automated GitHub releases** with changelogs
- **Code signing** and notarization for security
- **Professional distribution** ready for end users

## 🛠️ Prerequisites

### Required Tools
1. **Node.js 20+** with npm
2. **ImageMagick** for icon generation
3. **GitHub repository** with Actions enabled

### Platform-Specific Requirements

#### macOS Development
- **Xcode Command Line Tools**: `xcode-select --install`
- **Apple Developer Account** (for code signing)
- **IconUtil** (included with macOS)

#### Windows Development  
- **Windows SDK** or **Visual Studio Build Tools**
- **Code signing certificate** (optional but recommended)

#### Linux Development
- **Standard build tools**: `build-essential`
- **Native libraries** (automatically installed in CI)

## 🎯 Quick Setup (5-Minute Start)

### 1. Generate App Icons
```bash
# Run from project root
./scripts/generate-app-icons.sh
```

This creates all required icon formats:
- `app-icon.ico` (Windows)
- `app-icon.icns` (macOS) 
- `app-icon.png` (Linux)

### 2. Test Local Build
```bash
# Build and test locally
npm run electron:build
npm run electron:start

# Package for distribution
npm run electron:pack
```

### 3. Create Your First Release
```bash
# Tag and push (triggers automated release)
git tag v1.0.0
git push origin v1.0.0
```

The GitHub Action will automatically:
1. Build for all platforms (macOS, Windows, Linux)
2. Create a GitHub release with changelog
3. Upload installers/packages as release assets
4. Publish the release when all builds complete

## 🔒 Code Signing Setup (Optional but Recommended)

Code signing ensures users trust your app and prevents security warnings.

### macOS Code Signing & Notarization

#### 1. Apple Developer Account Setup
1. Join the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Create certificates in [Apple Developer Console](https://developer.apple.com/account/)

#### 2. Export Certificates
```bash
# Export from Keychain as .p12 files
# You'll need:
# - Developer ID Application certificate
# - Developer ID Installer certificate (for pkg files)
```

#### 3. GitHub Secrets Setup
Add these secrets in your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name | Description | Example |
|------------|-------------|---------|
| `CSC_LINK` | Base64-encoded .p12 certificate | `MIIK...` (base64 string) |
| `CSC_KEY_PASSWORD` | Certificate password | `your-cert-password` |
| `APPLEID` | Apple ID email | `your-email@example.com` |
| `APPLEIDPASS` | App-specific password | `abcd-efgh-ijkl-mnop` |
| `APPLETEAMID` | Apple Team ID | `XXXXXXXXXX` |

#### 4. Generate App-Specific Password
1. Go to [Apple ID Account](https://appleid.apple.com)
2. Sign in → **App-Specific Passwords**
3. Generate password for "Electron App Notarization"

#### 5. Convert Certificate to Base64
```bash
# Convert .p12 to base64 for GitHub Secrets
base64 -i your-certificate.p12 | pbcopy
# Paste into CSC_LINK secret
```

### Windows Code Signing (Optional)

#### 1. Obtain Code Signing Certificate
- Purchase from a Certificate Authority (Sectigo, DigiCert, etc.)
- Or use EV Code Signing Certificate for better trust

#### 2. GitHub Secrets for Windows
| Secret Name | Description |
|------------|-------------|
| `CSC_LINK_WIN` | Base64-encoded certificate |
| `CSC_KEY_PASSWORD_WIN` | Certificate password |

## 🔄 Release Process

### Automatic Releases (Recommended)

**Trigger**: Creating and pushing a version tag
```bash
git tag v1.2.3
git push origin v1.2.3
```

**What happens**:
1. **Create Release** - Draft GitHub release with changelog
2. **Build Matrix** - Parallel builds on macOS, Windows, Linux
3. **Upload Assets** - All installers added to release
4. **Publish** - Release goes live when all builds succeed
5. **Cleanup** - Failed builds automatically cleaned up

### Manual Releases

**Trigger**: GitHub Actions → "Electron Release" → "Run workflow"
1. Go to your repository → **Actions** tab
2. Select **"Electron Release"** workflow  
3. Click **"Run workflow"**
4. Enter version (e.g., `1.0.0`)
5. Click **"Run workflow"** button

### Release Outputs

Each release creates these downloadable files:

#### macOS
- `Prompt Craft-1.0.0.dmg` - Universal installer (Intel + Apple Silicon)
- `Prompt Craft-1.0.0-mac.zip` - Application bundle

#### Windows  
- `Prompt Craft Setup 1.0.0.exe` - NSIS installer
- `Prompt Craft-1.0.0-win.zip` - Portable version

#### Linux
- `Prompt Craft-1.0.0.AppImage` - Universal Linux app
- `prompt-craft_1.0.0_amd64.deb` - Debian package
- `prompt-craft-1.0.0.x86_64.rpm` - RPM package

## 🎨 Customizing Releases

### Update Release Notes Template

Edit `.github/workflows/electron-release.yml`:

```yaml
# Update the changelog generation section
CHANGELOG="## What's New in ${{ steps.get-version.outputs.version }}

### 🚀 New Features
- Add your features here

### 🐛 Bug Fixes  
- Add your fixes here

### 🛠️ Technical Updates
- Add technical changes here"
```

### Modify Build Targets

Edit `package.json` build configuration:

```json
{
  "build": {
    "mac": {
      "target": [
        { "target": "dmg", "arch": ["x64", "arm64"] },
        { "target": "zip", "arch": ["x64", "arm64"] }
      ]
    },
    "win": {
      "target": [
        { "target": "nsis", "arch": ["x64"] },
        { "target": "portable", "arch": ["x64"] }
      ]
    },
    "linux": {
      "target": [
        { "target": "AppImage", "arch": ["x64"] },
        { "target": "deb", "arch": ["x64"] },
        { "target": "rpm", "arch": ["x64"] }
      ]
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### "App is damaged and can't be opened" (macOS)
- **Cause**: Missing code signing or notarization
- **Solution**: Set up proper certificates and notarization

#### "Windows protected your PC" (Windows)  
- **Cause**: Unsigned executable
- **Solution**: Add Windows code signing certificate

#### Build Fails on Specific Platform
- **Check**: GitHub Actions logs for specific error messages
- **Solution**: Review platform-specific dependencies

#### Icons Not Generated
- **Cause**: Missing ImageMagick  
- **Solution**: `brew install imagemagick` (macOS)

### Debug Build Issues

#### Local Testing
```bash
# Clean build
npm run clean
npm run build
npm run electron:build

# Check build output
ls -la dist-electron/

# Test the app
npm run electron:start
```

#### CI/CD Debugging
1. Check **Actions** tab in GitHub repository
2. Click on failed workflow
3. Expand failed step to see detailed logs
4. Download build artifacts for inspection

### Release Verification

#### After Each Release
1. **Download installers** from GitHub Releases
2. **Test installation** on target platforms
3. **Verify app functionality** after installation
4. **Check code signing** status (no security warnings)

## 📊 Monitoring & Analytics

### Release Metrics
- **GitHub Releases** page shows download counts
- **GitHub Insights** → **Traffic** shows repository activity
- **Actions** tab shows build success rates

### User Feedback
- Monitor GitHub **Issues** for installation problems
- Check **Discussions** for user questions
- Set up crash reporting (optional) with services like Sentry

## 📚 Advanced Configuration

### Custom Build Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "release:patch": "npm version patch && git push origin main --tags",
    "release:minor": "npm version minor && git push origin main --tags",
    "release:major": "npm version major && git push origin main --tags",
    "prerelease": "npm run clean && npm run build && npm run electron:build"
  }
}
```

### Electron Builder Extensions

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "prompt-manager"
    },
    "compression": "maximum",
    "removePackageScripts": true,
    "directories": {
      "buildResources": "packages/apps/electron/assets"
    }
  }
}
```

## 🎯 Next Steps

### Immediate
1. ✅ Run icon generation script
2. ✅ Test local build process  
3. ✅ Create first release tag
4. ✅ Monitor build process

### Optional Enhancements
- 🔒 Set up code signing certificates
- 📊 Add crash reporting and analytics
- 🔄 Set up auto-updater for seamless updates
- 📋 Create installation guides for users
- 🧪 Add automated testing for releases

## 💡 Tips for Success

### Version Management
- Use [semantic versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- Tag releases consistently: `v1.0.0`, `v1.0.1`, etc.
- Keep changelog updated in each release

### User Experience  
- Test installers on clean systems
- Provide clear installation instructions
- Respond promptly to user issues
- Consider beta releases for testing

### Security
- Always use code signing in production
- Keep certificates secure and backed up
- Rotate certificates before expiration
- Monitor for security vulnerabilities

---

## 📞 Support

If you encounter issues:
1. Check this documentation first
2. Search [GitHub Issues](https://github.com/your-repo/issues)
3. Create a new issue with detailed information
4. Include build logs and error messages

**Happy releasing! 🚀**