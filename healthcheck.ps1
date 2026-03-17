# Ebbe Health Check (PowerShell)
# Usage: .\healthcheck.ps1
# Checks Docker containers, backend API, frontend, DB response time, and WebSocket.
# Automatically attempts to start containers if they are not running.

$ErrorActionPreference = 'Stop'

$EXPECTED_CONTAINERS = @('ebbe-backend', 'ebbe-frontend', 'ebbe-caddy')
$errors = 0

function Write-Pass($msg) { Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Warn($msg) { Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Hint($msg) { Write-Host "   Hint: $msg" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "Ebbe Health Check" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "─────────────────────────────"

# ── 1. Docker containers ────────────────────────────────────────────────────

function Test-Containers {
    try {
        $running = docker ps --format '{{.Names}}' 2>$null
    } catch {
        Write-Fail "Docker: cannot reach Docker daemon"
        Write-Hint "Make sure Docker Desktop is running."
        return $false
    }

    $missing = $EXPECTED_CONTAINERS | Where-Object { $running -notcontains $_ }

    if ($missing.Count -eq 0) {
        Write-Pass "Docker: all 3 containers running"
        return $true
    }

    Write-Warn "Docker: containers not running: $($missing -join ', ')"
    Write-Host "   Attempting to start with: docker compose up -d"

    try {
        docker compose up -d 2>&1 | Select-Object -Last 3 | ForEach-Object { Write-Host "   $_" }
        Write-Host "   Waiting 5 seconds for services to initialise..."
        Start-Sleep -Seconds 5

        $running = docker ps --format '{{.Names}}' 2>$null
        $stillMissing = $EXPECTED_CONTAINERS | Where-Object { $running -notcontains $_ }

        if ($stillMissing.Count -eq 0) {
            Write-Pass "Docker: all 3 containers now running"
            return $true
        } else {
            Write-Fail "Docker: still not running after start attempt: $($stillMissing -join ', ')"
            Write-Hint "Run 'docker compose logs' to see what went wrong."
            return $false
        }
    } catch {
        Write-Fail "Docker: 'docker compose up -d' failed: $_"
        Write-Hint "Check that docker-compose.yml exists and Docker is healthy."
        return $false
    }
}

if (-not (Test-Containers)) { $errors++ }

# ── 2. Backend API + Database response time ─────────────────────────────────

function Test-Backend {
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri 'http://localhost/api/v1/health' `
            -TimeoutSec 4 -UseBasicParsing -ErrorAction Stop
        $sw.Stop()
        $elapsed = $sw.ElapsedMilliseconds

        $json = $response.Content | ConvertFrom-Json
        if ($json.status -eq 'ok') {
            $ver = if ($json.version) { " (v$($json.version))" } else { "" }
            Write-Pass "Backend API: ok$ver"
        } else {
            Write-Fail "Backend API: unexpected response: $($response.Content)"
            return $false
        }

        # DB health — inferred from response latency
        if ($elapsed -lt 2000) {
            Write-Pass "Database: responding (${elapsed}ms)"
        } else {
            Write-Warn "Database: slow response (${elapsed}ms > 2000ms threshold)"
            Write-Hint "Inspect DB: docker exec ebbe-backend ls -lh /data/"
            $script:errors++
        }
        return $true
    } catch {
        Write-Fail "Backend API: no response — $_"
        Write-Hint "Check logs with: docker logs ebbe-backend"
        return $false
    }
}

if (-not (Test-Backend)) { $errors++ }

# ── 3. Frontend ─────────────────────────────────────────────────────────────

function Test-Frontend {
    try {
        $response = Invoke-WebRequest -Uri 'http://localhost' `
            -TimeoutSec 4 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Pass "Frontend: reachable"
            return $true
        } else {
            Write-Fail "Frontend: HTTP $($response.StatusCode) (expected 200)"
            Write-Hint "Check logs: docker logs ebbe-frontend  /  docker logs ebbe-caddy"
            return $false
        }
    } catch {
        Write-Fail "Frontend: no response — $_"
        Write-Hint "Check logs: docker logs ebbe-frontend  /  docker logs ebbe-caddy"
        return $false
    }
}

if (-not (Test-Frontend)) { $errors++ }

# ── 4. WebSocket ─────────────────────────────────────────────────────────────
# Sends a proper WS upgrade handshake to /ws and expects HTTP 101 Switching Protocols.
# The backend closes unauthenticated connections with 1008, but the 101 arrives first.

function Test-WebSocket {
    try {
        $tcp = [System.Net.Sockets.TcpClient]::new()
        $connectTask = $tcp.ConnectAsync('localhost', 80)
        if (-not $connectTask.Wait(3000)) {
            Write-Fail "WebSocket: TCP connect timed out"
            Write-Hint "Verify Caddy is running and port 80 is reachable."
            return $false
        }

        $stream = $tcp.GetStream()
        $key    = 'dGhlIHNhbXBsZSBub25jZQ=='
        $request = "GET /ws HTTP/1.1`r`nHost: localhost`r`nConnection: Upgrade`r`nUpgrade: websocket`r`nSec-WebSocket-Key: $key`r`nSec-WebSocket-Version: 13`r`n`r`n"
        $bytes  = [System.Text.Encoding]::ASCII.GetBytes($request)
        $stream.Write($bytes, 0, $bytes.Length)

        # Read response (up to 1KB, with 3s timeout)
        $stream.ReadTimeout = 3000
        $buf     = New-Object byte[] 1024
        $read    = 0
        try { $read = $stream.Read($buf, 0, $buf.Length) } catch { }
        $responseText = [System.Text.Encoding]::ASCII.GetString($buf, 0, $read)

        $tcp.Close()

        if ($responseText -match 'HTTP/1\.1 101') {
            Write-Pass "WebSocket: connectable"
            return $true
        } elseif ($responseText -match 'HTTP/1\.1 (\d{3})') {
            $code = $Matches[1]
            Write-Fail "WebSocket: unexpected HTTP $code (expected 101)"
            Write-Hint "Check backend WS handler: docker logs ebbe-backend"
            return $false
        } else {
            Write-Fail "WebSocket: no valid HTTP response from /ws"
            Write-Hint "Check Caddy config and: docker logs ebbe-caddy"
            return $false
        }
    } catch {
        Write-Fail "WebSocket: connection failed — $_"
        Write-Hint "Verify Caddy is forwarding /ws to the backend."
        return $false
    }
}

if (-not (Test-WebSocket)) { $errors++ }

# ── Summary ──────────────────────────────────────────────────────────────────

Write-Host "─────────────────────────────"
if ($errors -eq 0) {
    Write-Host "All systems operational!" -ForegroundColor Green
} else {
    Write-Host "$errors check(s) failed — see hints above." -ForegroundColor Red
    exit 1
}
