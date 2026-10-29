#!/bin/bash
# Restarts the Crestfall backend container if /api/health stops answering.
# Installed on the EC2 box as /usr/local/bin/crestfall-watchdog.sh and run every minute:
#   echo '* * * * * root /usr/local/bin/crestfall-watchdog.sh' | sudo tee /etc/cron.d/crestfall-watchdog
# Docker's own restart policy (unless-stopped) already covers crashes and reboots;
# this covers a process that is alive but no longer answering.
NAME=crestfall-backend
exec 9>/var/lock/crestfall-watchdog.lock
flock -n 9 || exit 0
for i in 1 2 3; do
  if curl -fsS -m 15 http://localhost:8000/api/health >/dev/null 2>&1; then exit 0; fi
  sleep 10
done
started=$(date -d "$(docker inspect -f '{{.State.StartedAt}}' $NAME 2>/dev/null)" +%s 2>/dev/null || echo 0)
if [ $(( $(date +%s) - started )) -lt 180 ]; then exit 0; fi   # just (re)started, give it time
echo "$(date -u +%FT%TZ) health check failed 3x - restarting $NAME" >> /var/log/crestfall-watchdog.log
docker restart $NAME >/dev/null 2>&1
