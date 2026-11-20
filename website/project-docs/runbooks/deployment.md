# Deployment Runbook

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] `npm run build` succeeds locally
- [ ] Environment variables set on target
- [ ] Database migrations run (if applicable)
- [ ] Feature flags configured

## Environments

| Environment | URL                  | Branch   | Auto Deploy |
| ----------- | -------------------- | -------- | ----------- |
| Development | http://localhost:3000 | -        | -           |
| Staging     |                      | develop  |             |
| Production  |                      | main     |             |

## Deploy Steps

### Vercel

```bash
# Preview deploy (automatic on PR)
git push origin feature-branch

# Production deploy
git push origin main
```

### Docker

```bash
docker compose -f docker-compose.yml up --build -d
```

## Rollback

```bash
# Vercel: redeploy previous commit from dashboard
# Docker:
docker compose down
docker compose -f docker-compose.yml up -d  # with previous image tag
```

## Post-Deployment Verification

- [ ] App loads without errors
- [ ] Login flow works
- [ ] API connectivity confirmed
- [ ] No new errors in monitoring
