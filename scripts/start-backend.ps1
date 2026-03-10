# Starts the backend in a detached process and opens the default browser
$preferred = 'C:\\Program Files\\nodejs\\node.exe'
if (Test-Path $preferred) {
    $nodePath = $preferred
} else {
    $nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
}
if (-not $nodePath) {
    Write-Error "Node.js not found in PATH. Install Node or update PATH.";
    exit 1
}

$isRunning = $false
try {
    $status = Invoke-WebRequest -Uri 'http://localhost:3000/status' -UseBasicParsing -TimeoutSec 2
    if ($status.StatusCode -ge 200 -and $status.StatusCode -lt 400) {
        $isRunning = $true
    }
} catch {
    $isRunning = $false
}

if (-not $isRunning) {
    Start-Process -FilePath $nodePath -ArgumentList 'backend/server.js' -WindowStyle Hidden
    Start-Sleep -Milliseconds 700
}

Start-Process 'http://localhost:3000'
