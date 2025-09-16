# DEPLOYMENT RULE

## CRITICAL: NEVER DEPLOY WITHOUT EXPLICIT CONSENT

**RULE**: Before running any deployment command (`vercel --prod`, `vercel deploy`, etc.), the assistant MUST:

1. **ASK FOR EXPLICIT PERMISSION** from the user
2. **WAIT for confirmation** before proceeding
3. **Never assume** deployment is wanted, even if code is ready

## Examples of Required Consent:

✅ **CORRECT**: "The code is ready. Would you like me to deploy this to production?"

❌ **INCORRECT**: Deploying automatically after building or committing code

## This Rule Applies To:
- Production deployments
- Staging deployments  
- Any external service deployments
- Database migrations in production
- Any action that affects live systems

## Exception:
Only local development commands (like `npm run dev`, `npm run build`) are allowed without explicit consent.

---
**This rule was added to prevent unauthorized deployments and ensure user control over their production systems.**