# Backend Deployment

This document covers deploying `conversa-studio.Web.Host` to Ubuntu behind Nginx at `http://russell.servecounterstrike.com`.

## Overview

- Runtime: `systemd`
- Reverse proxy: Nginx
- Backend bind address: `127.0.0.1:5000`
- Deploy model: GitHub Actions builds and publishes, then deploys over SSH
- Release layout:
  - `/var/www/conversa-studio/backend/releases/<release-id>/`
  - `/var/www/conversa-studio/backend/current`

## Server prerequisites

Install the .NET 9 runtime, Nginx, and required utilities:

```bash
sudo apt-get update
sudo apt-get install -y nginx unzip
sudo apt-get install -y aspnetcore-runtime-9.0
```

Create the app user and directories:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin conversa
sudo mkdir -p /var/www/conversa-studio/backend/releases
sudo chown -R conversa:www-data /var/www/conversa-studio
sudo chmod -R 775 /var/www/conversa-studio
```

## Application environment

The service expects these values in production:

- `ASPNETCORE_ENVIRONMENT=Production`
- `ASPNETCORE_URLS=http://127.0.0.1:5000`
- `ConnectionStrings__Default`
- `App__ServerRootAddress=http://russell.servecounterstrike.com/`
- `App__CorsOrigins=http://russell.servecounterstrike.com`
- `Authentication__JwtBearer__SecurityKey`
- `Authentication__JwtBearer__Issuer`
- `Authentication__JwtBearer__Audience`

Store sensitive values in `/etc/conversa-studio/backend.env`:

```bash
sudo mkdir -p /etc/conversa-studio
sudo nano /etc/conversa-studio/backend.env
```

Example:

```bash
ConnectionStrings__Default=Host=localhost;Port=5432;Database=conversa_studio;Username=postgres;Password=change-me
Authentication__JwtBearer__SecurityKey=change-me
Authentication__JwtBearer__Issuer=conversa-studio
Authentication__JwtBearer__Audience=conversa-studio
```

## Install the systemd service

Copy the repo-managed unit file into place and reload systemd:

```bash
sudo cp backend/aspnet-core/deploy/systemd/conversa-studio-backend.service /etc/systemd/system/conversa-studio-backend.service
sudo systemctl daemon-reload
sudo systemctl enable conversa-studio-backend.service
```

## Install the Nginx site

Copy the Nginx config into place, enable it, and reload Nginx:

```bash
sudo cp backend/aspnet-core/deploy/nginx/conversa-studio-backend.conf /etc/nginx/sites-available/conversa-studio-backend.conf
sudo ln -sf /etc/nginx/sites-available/conversa-studio-backend.conf /etc/nginx/sites-enabled/conversa-studio-backend.conf
sudo nginx -t
sudo systemctl reload nginx
```

## GitHub Actions secrets

Add these repository secrets:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PORT`
- `DEPLOY_KNOWN_HOSTS` (optional but recommended)

## Deployment flow

The workflow:

1. Restores, tests, and publishes the backend.
2. Archives the published output.
3. Uploads the archive to the Ubuntu server over SSH.
4. Extracts into `/var/www/conversa-studio/backend/releases/<github-sha>/`.
5. Re-points `/var/www/conversa-studio/backend/current`.
6. Restarts `conversa-studio-backend.service`.

## First deployment checklist

1. Install server prerequisites.
2. Add production environment values to the service definition.
3. Install the `systemd` unit and Nginx config.
4. Create the GitHub repository secrets.
5. Run the workflow manually with `workflow_dispatch` or push to `main`.
6. Verify:
   - `systemctl status --no-pager conversa-studio-backend.service`
   - `curl http://127.0.0.1:5000`
   - `curl -H "Host: russell.servecounterstrike.com" http://127.0.0.1`
   - open `http://russell.servecounterstrike.com`
