# Backend Deployment

This project now uses a self-bootstrapping GitHub Actions deployment flow for `conversa-studio.Web.Host` on Ubuntu behind Nginx at `https://russell.servecounterstrike.com`.

## Overview

- Runtime: `systemd`
- Reverse proxy: Nginx
- Backend bind address: `127.0.0.1:5000`
- Deploy model: GitHub Actions publishes the app, uploads the release archive, and writes the service/env/Nginx config directly on the server
- Release layout:
  - `/var/www/conversa-studio/backend/releases/<release-id>/`
  - `/var/www/conversa-studio/backend/current`

## Required GitHub secrets

Add these repository secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PORT`
- `DB_CONNECTION_STRING`
- `JWT_SECURITY_KEY`

## Server requirements

The server only needs:

- Ubuntu with SSH access
- a deploy user that can run passwordless `sudo`

The workflow installs Nginx and the ASP.NET Core 9 runtime if missing, creates the release directories, writes `/etc/conversa-studio/backend.env`, writes the `systemd` unit, writes the Nginx site config, and restarts the app.

If your deploy user is `ubuntu`, add a sudoers rule with `visudo`:

```bash
ubuntu ALL=(ALL) NOPASSWD:ALL
```

You can tighten that later, but this is the simplest way to get the bootstrap deploy working first.

## What the workflow does

1. Restores, tests, and publishes the backend.
2. Archives the published output into `backend-release.tar.gz`.
3. Uploads the archive to `/tmp/` on the server.
4. Installs Nginx and the ASP.NET Core 9 runtime if they are missing.
5. Creates `/var/www/conversa-studio/backend/releases/<github-sha>/`.
6. Extracts the archive there and updates `/var/www/conversa-studio/backend/current`.
7. Writes `/etc/conversa-studio/backend.env` from GitHub secrets.
8. Writes `/etc/systemd/system/conversa-studio-backend.service`.
9. Writes `/etc/nginx/sites-available/conversa-studio-backend.conf`.
10. Enables the `systemd` service, validates Nginx config, restarts the backend, and reloads Nginx.

## Verification

After deployment, check:

```bash
sudo systemctl status --no-pager conversa-studio-backend.service
curl http://127.0.0.1:5000
curl -H "Host: russell.servecounterstrike.com" http://127.0.0.1
```

Then open:

```text
https://russell.servecounterstrike.com
```
