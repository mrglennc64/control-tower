#!/usr/bin/env bash
#
# Control Tower — VPS deploy script.
# Run as root ON the server (187.77.111.16). Download it, read it, then run:
#   bash deploy-vps.sh
#
# It builds the app, runs it as a systemd service on 127.0.0.1:3020 under
# basePath /crm, and creates the Basic Auth password file. nginx itself is
# configured separately (see deploy/nginx-crm.conf + DEPLOY.md), so this
# script never touches your existing nginx config or the heyroya services.

set -euo pipefail

REPO="https://github.com/mrglennc64/control-tower.git"
APP_DIR="/opt/control-tower"
DATA_DIR="/var/lib/control-tower/data"
PORT="3020"
BASE_PATH="/crm"
SERVICE="control-tower"
HTPASSWD="/etc/nginx/.htpasswd-crm"

echo ">> Control Tower deploy starting"

# 1. Make sure the chosen port is free (don't collide with heyroya/trapcrm).
if ss -ltnp 2>/dev/null | grep -q ":${PORT} "; then
  echo "!! Port ${PORT} is already in use. Edit PORT at the top of this script"
  echo "   (and deploy/nginx-crm.conf) to a free port, then re-run."
  ss -ltnp | grep ":${PORT} " || true
  exit 1
fi

# 2. Node >= 20.
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'parseInt(process.versions.node,10)')" -lt 20 ]; then
  echo ">> Installing Node 20 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo ">> Using Node $(node -v)"

# 3. Fetch the code.
if [ -d "$APP_DIR/.git" ]; then
  echo ">> Updating $APP_DIR"
  git -C "$APP_DIR" fetch --depth 1 origin main
  git -C "$APP_DIR" reset --hard origin/main
else
  echo ">> Cloning into $APP_DIR"
  git clone --depth 1 "$REPO" "$APP_DIR"
fi

# 4. Data directory (persists across deploys; back this up).
mkdir -p "$DATA_DIR"

# 5. Install + build with the subpath baked in.
cd "$APP_DIR"
echo ">> npm ci"
npm ci
echo ">> Building with basePath=${BASE_PATH}"
NEXT_PUBLIC_BASE_PATH="$BASE_PATH" DATA_DIR="$DATA_DIR" npm run build

# 6. systemd service (runs `next start`; env must match the build).
echo ">> Writing /etc/systemd/system/${SERVICE}.service"
cat >/etc/systemd/system/${SERVICE}.service <<EOF
[Unit]
Description=Founder Control Tower
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
Environment=PORT=${PORT}
Environment=NEXT_PUBLIC_BASE_PATH=${BASE_PATH}
Environment=DATA_DIR=${DATA_DIR}
Environment=NODE_ENV=production
ExecStart=$(command -v npm) run start
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "${SERVICE}"
systemctl restart "${SERVICE}"
sleep 3
systemctl --no-pager --full status "${SERVICE}" | head -n 12 || true

# 7. Basic Auth credentials (the public login gate).
if [ ! -f "$HTPASSWD" ]; then
  command -v htpasswd >/dev/null 2>&1 || apt-get install -y apache2-utils
  echo ">> Create the dashboard login (Basic Auth):"
  read -rp "   Username: " CT_USER
  htpasswd -c "$HTPASSWD" "$CT_USER"
else
  echo ">> Basic Auth file already exists at $HTPASSWD (leaving as-is)"
fi

# 8. Local smoke test (before nginx).
echo ">> Local probe (expect 200s):"
curl -s -o /dev/null -w "   127.0.0.1:${PORT}${BASE_PATH}            -> %{http_code}\n" "http://127.0.0.1:${PORT}${BASE_PATH}" || true
curl -s -o /dev/null -w "   127.0.0.1:${PORT}${BASE_PATH}/api/products -> %{http_code}\n" "http://127.0.0.1:${PORT}${BASE_PATH}/api/products" || true

cat <<DONE

>> App is built and running on 127.0.0.1:${PORT} (basePath ${BASE_PATH}).
   Data dir:   ${DATA_DIR}
   Service:    systemctl status ${SERVICE}   |   journalctl -u ${SERVICE} -f

NEXT: wire nginx (one-time). See deploy/nginx-crm.conf and DEPLOY.md —
replace the existing `location /crm { ... }` (TrapCRM) in the
crm.traproyalties.com server block, then:  nginx -t && systemctl reload nginx
DONE
