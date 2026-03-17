#!/usr/bin/env bash
# Ebbe Health Check
# Usage: ./healthcheck.sh
# Checks Docker containers, backend API, frontend, DB response time, and WebSocket.
# Automatically attempts to start containers if they are not running.

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

PASS="${GREEN}✅${RESET}"
FAIL="${RED}❌${RESET}"
WARN="${YELLOW}⚠️ ${RESET}"

EXPECTED_CONTAINERS=("ebbe-backend" "ebbe-frontend" "ebbe-caddy")
ERRORS=0

echo ""
echo -e "${BOLD}Ebbe Health Check${RESET}"
echo "─────────────────────────────"

# ── 1. Docker containers ────────────────────────────────────────────────────

check_containers() {
  local running
  running=$(docker ps --format '{{.Names}}' 2>/dev/null) || {
    echo -e "${FAIL} Docker: cannot reach Docker daemon"
    echo "   Hint: make sure Docker Desktop is running."
    return 1
  }

  local missing=()
  for name in "${EXPECTED_CONTAINERS[@]}"; do
    if ! echo "$running" | grep -qx "$name"; then
      missing+=("$name")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    echo -e "${PASS} Docker: all 3 containers running"
    return 0
  else
    echo -e "${WARN} Docker: containers not running: ${missing[*]}"
    echo "   Attempting to start with: docker compose up -d"
    if docker compose up -d 2>&1 | tail -3; then
      echo "   Waiting 5 seconds for services to initialise..."
      sleep 5
      # Re-check
      running=$(docker ps --format '{{.Names}}' 2>/dev/null)
      local still_missing=()
      for name in "${EXPECTED_CONTAINERS[@]}"; do
        if ! echo "$running" | grep -qx "$name"; then
          still_missing+=("$name")
        fi
      done
      if [[ ${#still_missing[@]} -eq 0 ]]; then
        echo -e "${PASS} Docker: all 3 containers now running"
        return 0
      else
        echo -e "${FAIL} Docker: still not running after start attempt: ${still_missing[*]}"
        echo "   Hint: run 'docker compose logs' to see what went wrong."
        return 1
      fi
    else
      echo -e "${FAIL} Docker: 'docker compose up -d' failed."
      echo "   Hint: check that docker-compose.yml exists and Docker is healthy."
      return 1
    fi
  fi
}

if ! check_containers; then
  ERRORS=$((ERRORS + 1))
fi

# ── 2. Backend API + Database response time ─────────────────────────────────

check_backend() {
  local start end elapsed body status version
  start=$(date +%s%3N)
  body=$(curl -sf --max-time 4 http://localhost/api/v1/health 2>/dev/null) || {
    elapsed=$(( $(date +%s%3N) - start ))
    echo -e "${FAIL} Backend API: no response after ${elapsed}ms"
    echo "   Hint: check logs with 'docker logs ebbe-backend'"
    return 1
  }
  end=$(date +%s%3N)
  elapsed=$(( end - start ))

  status=$(echo "$body" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || true)
  version=$(echo "$body" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || true)

  if [[ "$status" == "ok" ]]; then
    echo -e "${PASS} Backend API: ok${version:+ (v$version)}"
  else
    echo -e "${FAIL} Backend API: unexpected response: $body"
    return 1
  fi

  # DB check — inferred from response latency
  if [[ $elapsed -lt 2000 ]]; then
    echo -e "${PASS} Database: responding (${elapsed}ms)"
  else
    echo -e "${WARN} Database: slow response (${elapsed}ms > 2000ms threshold)"
    echo "   Hint: inspect DB file with 'docker exec ebbe-backend ls -lh /data/'"
    ERRORS=$((ERRORS + 1))
  fi
}

if ! check_backend; then
  ERRORS=$((ERRORS + 1))
fi

# ── 3. Frontend ─────────────────────────────────────────────────────────────

check_frontend() {
  local code
  code=$(curl -so /dev/null -w "%{http_code}" --max-time 4 http://localhost 2>/dev/null) || code="000"
  if [[ "$code" == "200" ]]; then
    echo -e "${PASS} Frontend: reachable"
  else
    echo -e "${FAIL} Frontend: HTTP $code (expected 200)"
    echo "   Hint: check logs with 'docker logs ebbe-frontend' and 'docker logs ebbe-caddy'"
    return 1
  fi
}

if ! check_frontend; then
  ERRORS=$((ERRORS + 1))
fi

# ── 4. WebSocket ─────────────────────────────────────────────────────────────
# Sends a proper WS upgrade handshake to /ws and expects HTTP 101 Switching Protocols.
# The backend closes unauthenticated connections with 1008, but the 101 still arrives first.

check_websocket() {
  # Use -i to capture raw response headers; curl %{http_code} does not capture 101.
  # Avoid piping into head -1 under set -o pipefail (broken pipe causes false failure).
  local ws_raw first_line
  ws_raw=$(curl -si --max-time 3 \
    --http1.1 \
    -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    -H "Sec-WebSocket-Version: 13" \
    http://localhost/ws 2>/dev/null || true)
  first_line=$(echo "$ws_raw" | head -1)

  if echo "$first_line" | grep -q "101"; then
    echo -e "${PASS} WebSocket: connectable"
  elif [[ -z "$first_line" ]]; then
    echo -e "${FAIL} WebSocket: connection refused or timed out"
    echo "   Hint: verify Caddy is forwarding /ws to the backend. Check 'docker logs ebbe-caddy'"
    return 1
  else
    local code
    code=$(echo "$first_line" | awk '{print $2}')
    echo -e "${FAIL} WebSocket: unexpected HTTP $code (expected 101)"
    echo "   Hint: check backend WebSocket handler in 'docker logs ebbe-backend'"
    return 1
  fi
}

if ! check_websocket; then
  ERRORS=$((ERRORS + 1))
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo "─────────────────────────────"
if [[ $ERRORS -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}All systems operational!${RESET}"
else
  echo -e "${RED}${BOLD}$ERRORS check(s) failed — see hints above.${RESET}"
  exit 1
fi
