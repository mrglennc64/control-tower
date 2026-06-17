# Deploying Control Tower to the VPS (crm.traproyalties.com/crm)

This replaces the current **TrapCRM** app at `/crm` with Control Tower, behind an
nginx Basic Auth login. It runs as a systemd service on `127.0.0.1:3020` and does
**not** touch the heyroya services on the same box.

> ⚠️ **Privacy:** Basic Auth is the only thing standing between the public internet
> and your buyer pipeline / financials / documents. Use a strong password, and
> serve only over HTTPS (the existing cert for crm.traproyalties.com already does).

## 0. Prep — what's there now
- `crm.traproyalties.com/crm` currently serves **TrapCRM** (a separate Next.js app).
  Find how it runs so you can stop it after cutover:
  ```bash
  systemctl list-units | grep -iE 'trap|crm'   # or:
  pm2 ls
  ss -ltnp                                      # note which port TrapCRM uses
  ```

## 1. Run the app deploy script (as root, on the server)
```bash
curl -fsSL https://raw.githubusercontent.com/mrglennc64/control-tower/main/deploy/deploy-vps.sh -o deploy-vps.sh
less deploy-vps.sh            # read it first
bash deploy-vps.sh
```
It installs Node 20 (if needed), clones to `/opt/control-tower`, builds with
`basePath=/crm`, starts the `control-tower` systemd service, and prompts you to
create the Basic Auth username/password. The local probe at the end should print
`200` for `/crm` and `/crm/api/products`.

## 2. Point nginx at it (one-time, manual — careful)
1. Back up the site config:
   ```bash
   cp -a /etc/nginx/sites-available/* /root/nginx-backup-$(date +%F)/  2>/dev/null || \
   cp -a /etc/nginx/conf.d/* /root/nginx-backup-$(date +%F)/ 2>/dev/null
   ```
2. Open the server block serving **crm.traproyalties.com** (the `listen 443` one).
   Find its existing `location /crm { ... }` (TrapCRM) and **replace** it with the
   block in [`nginx-crm.conf`](./nginx-crm.conf).
3. Test and reload (this is atomic; a bad config won't take effect):
   ```bash
   nginx -t && systemctl reload nginx
   ```
4. (After verifying) stop TrapCRM so it isn't running for nothing, e.g.
   `systemctl disable --now <trapcrm-unit>` or `pm2 delete <trapcrm>`.

## 3. Verify
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://crm.traproyalties.com/crm           # 401 (auth required) ✅
curl -s -o /dev/null -w "%{http_code}\n" -u USER:PASS https://crm.traproyalties.com/crm  # 200 ✅
```
Then open https://crm.traproyalties.com/crm in a browser — you should get a login
prompt, then the dashboard.

## Updating later
```bash
bash /opt/control-tower/deploy/deploy-vps.sh   # pulls main, rebuilds, restarts
```

## Rollback
- Restore the nginx `location /crm` block from your backup, `nginx -t && systemctl reload nginx`,
  and re-enable TrapCRM. Control Tower can be left stopped: `systemctl stop control-tower`.

## Notes / caveats
- **Data lives on the server** at `/var/lib/control-tower/data` (not OneDrive). Back it up:
  `tar czf ct-data-$(date +%F).tgz -C /var/lib/control-tower data`. The app also writes
  startup snapshots to `data/backups/`.
- The seeded **document locations** point at Windows OneDrive paths, so those links won't
  resolve on the server — they're just reference strings; edit them from the Vault tab.
- Port `3020` is assumed free. If not, change `PORT` in `deploy-vps.sh` **and** the
  `proxy_pass` port in `nginx-crm.conf`.
