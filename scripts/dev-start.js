const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

const children = [];
let shuttingDown = false;

function runCommand(command, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });

    child.on('error', (error) => {
      reject(new Error(`[${label}] failed to start: ${error.message}`));
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`[${label}] exited with code ${code ?? 'unknown'}`));
    });
  });
}

function isHttpUp(url, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.on('error', () => {
      resolve(false);
    });
  });
}

function isPortInUse(port, host = '127.0.0.1', timeoutMs = 1200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const settle = (value) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => settle(true));
    socket.once('timeout', () => settle(false));
    socket.once('error', () => settle(false));

    socket.connect(port, host);
  });
}

function startProcess(command, label) {
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  children.push({ child, label });

  child.on('exit', (code) => {
    if (shuttingDown) {
      return;
    }
    console.log(`[${label}] exited with code ${code ?? 'unknown'}.`);
  });

  child.on('error', (error) => {
    if (shuttingDown) {
      return;
    }
    console.error(`[${label}] error: ${error.message}`);
  });

  return child;
}

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log('\n[dev:start] stopping dev processes...');

  for (const { child, label } of children) {
    if (child.killed) {
      continue;
    }

    try {
      child.kill('SIGINT');
    } catch (error) {
      console.error(`[${label}] could not stop cleanly: ${error.message}`);
    }
  }

  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

(async () => {
  try {
    console.log('[dev:start] step 1/3: starting Docker services...');
    await runCommand('docker compose -f docker/docker-compose.yml up -d', 'docker');

    const apiUp = await isHttpUp('http://127.0.0.1:3000/health');
    if (apiUp) {
      console.log('[dev:start] step 2/3: backend API is already running on http://localhost:3000.');
    } else {
      console.log('[dev:start] step 2/3: starting backend API...');
      startProcess('npm run dev', 'api');
    }

    const uiUpLocalhost = await isPortInUse(5173, 'localhost');
    const uiUpLoopback = uiUpLocalhost ? true : await isPortInUse(5173, '127.0.0.1');
    const uiUp = uiUpLocalhost || uiUpLoopback;
    if (uiUp) {
      console.log('[dev:start] step 3/3: UI is already running on http://localhost:5173.');
    } else {
      console.log('[dev:start] step 3/3: starting UI dev server...');
      startProcess('npm run ui:dev', 'ui');
    }

    console.log('[dev:start] all services launched.');
    console.log('[dev:start] API: http://localhost:3000');
    console.log('[dev:start] UI:  http://localhost:5173');
    if (children.length > 0) {
      console.log('[dev:start] press Ctrl+C to stop the npm processes started by this command.');
    } else {
      console.log('[dev:start] nothing new to start; all services were already up.');
    }
  } catch (error) {
    console.error(`[dev:start] ${error.message}`);
    process.exit(1);
  }
})();
