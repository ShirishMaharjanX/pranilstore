const { spawn, spawnSync, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const projectRoot = path.join(__dirname, '..');
const serverPath = path.join(projectRoot, 'backend', 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('backend/server.js not found from', projectRoot);
  process.exit(1);
}

const nodeCandidates = [
  'C:\\Program Files\\nodejs\\node.exe',
  process.execPath,
  'node'
];
let nodePath = nodeCandidates.find(p => {
  try { return fs.existsSync(p); } catch (e) { return false; }
});
if (!nodePath) nodePath = 'node';
const args = new Set(process.argv.slice(2));
const shouldOpenBrowser = !args.has('--no-open');
const setupOnly = args.has('--setup-only');
const skipAdminCheck = args.has('--skip-admin-check');

function ensureDependencies() {
  const requiredPackages = ['express', 'cors', 'serverless-http'];
  const missingPackages = requiredPackages.filter(pkg => !fs.existsSync(path.join(projectRoot, 'node_modules', pkg)));
  if (missingPackages.length === 0) {
    return;
  }

  console.log(`Installing missing dependencies: ${missingPackages.join(', ')}`);
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const installResult = spawnSync(npmCommand, ['install'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (installResult.status !== 0) {
    throw new Error('Dependency installation failed. Run "npm install" and retry.');
  }
}

function checkServer(pathname = '/diag', timeout = 1500) {
  return new Promise((resolve) => {
    const req = http.get({
      hostname: '127.0.0.1',
      port: 3000,
      path: pathname,
      timeout
    }, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startBackendDetached() {
  const child = spawn(nodePath, [serverPath], {
    detached: true,
    stdio: 'ignore',
    cwd: projectRoot
  });
  child.unref();
}

function waitForStatus(retries = 60, delay = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryOnce = () => {
      attempts++;
      const req = http.get({ hostname: '127.0.0.1', port: 3000, path: '/status', timeout: 3000 }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else if (attempts >= retries) {
          reject(new Error('No healthy response'));
        } else {
          setTimeout(tryOnce, delay);
        }
      });
      req.on('error', () => {
        if (attempts >= retries) return reject(new Error('Server did not start in time'));
        setTimeout(tryOnce, delay);
      });
      req.on('timeout', () => {
        req.destroy();
        if (attempts >= retries) return reject(new Error('Timed out waiting for server'));
      });
    };
    tryOnce();
  });
}

function openBrowser(url) {
  const runCommand = (command) => {
    try {
      exec(command, (error) => {
        if (error) {
          console.warn(`Browser launch skipped: ${error.message}`);
        }
      });
    } catch (error) {
      console.warn(`Browser launch skipped: ${error.message}`);
    }
  };

  const plat = process.platform;
  if (plat === 'win32') {
    runCommand(`start "" "${url}"`);
  } else if (plat === 'darwin') {
    runCommand(`open "${url}"`);
  } else {
    runCommand(`xdg-open "${url}"`);
  }
}

function testAdminLogin(password) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ password });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/admin/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          console.log('/api/admin/login ->', JSON.parse(body));
        } catch (error) {
          console.log('/api/admin/login ->', body);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Admin login request failed:', error.message);
      resolve();
    });
    req.setTimeout(5000, () => {
      req.destroy(new Error('Admin login probe timed out'));
    });
    req.write(postData);
    req.end();
  });
}

(async () => {
  try {
    ensureDependencies();
    if (setupOnly) {
      console.log('Setup complete. Dependencies are installed.');
      return;
    }

    const alreadyRunning = await checkServer('/status');
    if (alreadyRunning) {
      console.log('Backend already running at http://localhost:3000');
    } else {
      console.log('Starting backend (detached)...');
      startBackendDetached();
      await waitForStatus();
      console.log('Backend started at http://localhost:3000');
    }

    const url = 'http://localhost:3000';
    if (shouldOpenBrowser) {
      openBrowser(url);
    } else {
      console.log('Browser launch skipped (--no-open).');
    }

    // Validate admin endpoint quickly (uses ADMIN_PASSWORD env or default).
    if (!skipAdminCheck) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      await testAdminLogin(adminPassword);
    }

  } catch (err) {
    console.error('Auto-start failed:', err.message);
    process.exit(1);
  }
})();
