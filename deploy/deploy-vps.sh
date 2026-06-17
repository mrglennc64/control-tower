#!/usr/bin/env bash
#
# Control Tower — VPS deploy for its own subdomain (control.usesmpt.com).
# Run as root ON the server (187.77.111.16). Download, read, then run:
#   bash deploy-vps.sh
#
# This is fully isolated from your other sites: it adds a NEW nginx server
# block (a new file) and runs the app on 127.0.0.1:3020. It never edits the
# existing crm.traproyalties.com / heyroya configs, so TrapCRM is untouched.

set -euo pipefail

DOMAIN="control.usesmpt.com"
REPO="https://github.com/mrglennc64/control-tower.git"
APP_DIR="/opt/control-tower"
DATA_DIR="/var/lib/control-tower/data"
PORT="3020"
SERVICE="control-tower"
HTPASSWD="/etc/nginx/.htpasswd-control"
SITE="/etc/nginx/sites-available/${DOMAIN}"

echo ">> Control Tower deploy for https://${DOMAIN}"

# 1. Port free? (don't collide with heyroya/trapcrm). On redeploy our own
#    service holds the port, which is fine — restart rebinds it.
if ss -ltnp 2>/dev/null | grep -q ":${PORT} "; then
  if systemctl is-active --quiet "${SERVICE}"; then
    echo ">> Port ${PORT} held by ${SERVICE} (redeploy) — continuing"
  else
    echo "!! Port ${PORT} already in use by another process — edit PORT and re-run."
    ss -ltnp | grep ":${PORT} " || true
    exit 1
  fi
fi

# 2. Node >= 20
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'parseInt(process.versions.node,10)')" -lt 20 ]; then
  echo ">> Installing Node 20 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo ">> Using Node $(node -v)"

# 3. Code
if [ -d "$APP_DIR/.git" ]; then
  echo ">> Updating $APP_DIR"
  git -C "$APP_DIR" fetch --depth 1 origin main
  git -C "$APP_DIR" reset --hard origin/main
else
  echo ">> Cloning into $APP_DIR"
  git clone --depth 1 "$REPO" "$APP_DIR"
fi

# 4. Data dir (persists across deploys — back this up)
mkdir -p "$DATA_DIR"

# 5. Build (served at the subdomain ROOT, so NO basePath)
cd "$APP_DIR"
echo ">> npm ci"
npm ci
echo ">> Building (root, no basePath)"
DATA_DIR="$DATA_DIR" npm run build

# 6. systemd service
echo ">> Writing /etc/systemd/system/${SERVICE}.service"
cat >/etc/systemd/system/${SERVICE}.service <<EOF
[Unit]
Description=Founder Control Tower
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
Environment=PORT=${PORT}
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

echo ">> Local probe (expect 200s):"
curl -s -o /dev/null -w "   127.0.0.1:${PORT}/             -> %{http_code}\n" "http://127.0.0.1:${PORT}/" || true
curl -s -o /dev/null -w "   127.0.0.1:${PORT}/api/products -> %{http_code}\n" "http://127.0.0.1:${PORT}/api/products" || true

# 7. Basic Auth credentials (the public login gate)
if [ ! -f "$HTPASSWD" ]; then
  command -v htpasswd >/dev/null 2>&1 || apt-get install -y apache2-utils
  echo ">> Create the dashboard login (Basic Auth):"
  read -rp "   Username: " CT_USER
  htpasswd -c "$HTPASSWD" "$CT_USER"
else
  echo ">> Basic Auth file already exists at $HTPASSWD (leaving as-is)"
fi

# 8. nginx server block (NEW file — additive, validated before reload)
echo ">> Writing nginx site ${SITE}"
cat >"$SITE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Let certbot's HTTP-01 challenge through without auth.
    location ^~ /.well-known/acme-challenge/ {
        auth_basic off;
        root /var/www/html;
    }

    location / {
        auth_basic           "Control Tower";
        auth_basic_user_file ${HTPASSWD};

        proxy_pass         http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }
}
EOF
ln -sf "$SITE" "/etc/nginx/sites-enabled/${DOMAIN}"
mkdir -p /var/www/html

echo ">> nginx -t"
nginx -t
systemctl reload nginx

# 9. TLS via certbot (adds the 443 block + http->https redirect)
if command -v certbot >/dev/null 2>&1; then
  echo ">> Requesting TLS cert for ${DOMAIN}"
  certbot --nginx -d "${DOMAIN}" --redirect --agree-tos -m "${CERTBOT_EMAIL:-mrglenncarter@yahoo.com}" -n || {
    echo "!! certbot failed — the site is up on HTTP. Re-run: certbot --nginx -d ${DOMAIN}"
  }
else
  echo "!! certbot not installed. App is on HTTP only. Install certbot then:"
  echo "   certbot --nginx -d ${DOMAIN}"
fi

cat <<DONE

>> Done. Control Tower should be live at:  https://${DOMAIN}
   Service:  systemctl status ${SERVICE}   |   journalctl -u ${SERVICE} -f
   Data dir: ${DATA_DIR}   (back up: tar czf ct-data.tgz -C /var/lib/control-tower data)
   TrapCRM at crm.traproyalties.com/crm was not touched.

Updating later:  bash /opt/control-tower/deploy/deploy-vps.sh
DONE
