#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Crestfall - one-time server setup.  Run ON the server as root.
# Tested shape: Ubuntu 22.04 / 24.04, Debian 12.
#
#   ssh root@<server-ip>
#   bash bootstrap-server.sh
#
# It installs the runtime, creates the app user and the /opt/crestfall home.
# Code and the ~2 GB of CSVs are copied afterwards by push-to-server.ps1.
# ---------------------------------------------------------------------------
set -euo pipefail

APP_DIR=/opt/crestfall
APP_USER=crestfall

echo "==> Installing system packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  python3 python3-venv python3-pip \
  caddy rsync curl ca-certificates

echo "==> Creating the ${APP_USER} service user"
id -u ${APP_USER} >/dev/null 2>&1 || useradd --create-home --shell /usr/sbin/nologin ${APP_USER}

mkdir -p ${APP_DIR}
chown -R ${APP_USER}:${APP_USER} ${APP_DIR}

echo "==> Python runtime"
python3 --version
sudo -u ${APP_USER} python3 -m venv ${APP_DIR}/.venv

echo "==> Firewall (allow web traffic)"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp >/dev/null || true
  ufw allow 443/tcp >/dev/null || true
fi

echo
echo "Done. Next, from your Windows machine:"
echo "  powershell -File push-to-server.ps1 -Host <server-ip> -User root"
echo
