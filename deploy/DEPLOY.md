# Deploying Control Tower to its own subdomain (control.usesmpt.com)

Control Tower runs at **https://control.usesmpt.com** behind an nginx Basic Auth
login. It's fully isolated from the rest of the box: a new systemd service on
`127.0.0.1:3020` and a brand-new nginx server block. **TrapCRM (crm.traproyalties.com/crm)
and the heyroya services are not touched.**

> ⚠️ **Privacy:** Basic Auth + HTTPS is the only thing between the public internet
> and your buyer pipeline / financials / documents. Use a strong password.

## Prerequisites
- DNS: `control.usesmpt.com` → `187.77.111.16` (already done ✅).
- `certbot` with the nginx plugin on the server (the box already serves other
  HTTPS sites, so this is normally present).

## Deploy (as root, on the server) — one command
```bash
curl -fsSL https://raw.githubusercontent.com/mrglennc64/control-tower/main/deploy/deploy-vps.sh -o deploy-vps.sh
less deploy-vps.sh        # read it first
bash deploy-vps.sh
```
The script:
1. installs Node 20 if needed, clones to `/opt/control-tower`, builds (root, no basePath);
2. runs it as the `control-tower` systemd service on `127.0.0.1:3020`;
3. prompts you to create the Basic Auth username/password;
4. writes a **new** nginx server block for `control.usesmpt.com`, validates (`nginx -t`) and reloads;
5. runs `certbot --nginx` to add TLS + an HTTP→HTTPS redirect.

To use a specific email for certbot: `CERTBOT_EMAIL=you@example.com bash deploy-vps.sh`.

## Verify
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://control.usesmpt.com/                 # 401 (auth required) ✅
curl -s -o /dev/null -w "%{http_code}\n" -u USER:PASS https://control.usesmpt.com/     # 200 ✅
```
Then open https://control.usesmpt.com in a browser → login prompt → dashboard.

## Updating later
```bash
bash /opt/control-tower/deploy/deploy-vps.sh   # pulls main, rebuilds, restarts
```

## Rollback / removal (leaves everything else intact)
```bash
systemctl disable --now control-tower
rm /etc/nginx/sites-enabled/control.usesmpt.com
nginx -t && systemctl reload nginx
```

## Notes
- **Data lives on the server** at `/var/lib/control-tower/data` (not OneDrive). Back it up:
  `tar czf ct-data-$(date +%F).tgz -C /var/lib/control-tower data`. The app also writes
  startup snapshots to `data/backups/`.
- Seeded **document locations** point at Windows OneDrive paths and won't resolve on the
  server — they're just reference strings; edit them from the Vault tab.
- Port `3020` is assumed free; change `PORT` in `deploy-vps.sh` (and the proxy port in the
  generated nginx block) if not.
- `nginx-control.conf` in this folder mirrors what the script writes, for reference.
