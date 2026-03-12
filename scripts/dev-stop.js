const { spawn } = require('child_process');

function runCommand(command, label, options = {}) {
  const { allowFailure = false } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });

    child.on('error', (error) => {
      if (allowFailure) {
        console.warn(`[${label}] failed to start: ${error.message}`);
        resolve();
        return;
      }
      reject(new Error(`[${label}] failed to start: ${error.message}`));
    });

    child.on('exit', (code) => {
      if (code === 0 || allowFailure) {
        if (code !== 0 && allowFailure) {
          console.warn(`[${label}] exited with code ${code ?? 'unknown'}, continuing.`);
        }
        resolve();
        return;
      }
      reject(new Error(`[${label}] exited with code ${code ?? 'unknown'}`));
    });
  });
}

function stopHostProcessesCommand() {
  if (process.platform === 'win32') {
    return 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = 3000,5173; Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; exit 0"';
  }

  return 'for p in 3000 5173; do pids=$(lsof -ti tcp:$p 2>/dev/null); if [ -n "$pids" ]; then kill $pids; fi; done';
}

(async () => {
  try {
    console.log('[dev:stop] step 1/2: stopping host API/UI processes on ports 3000 and 5173...');
    await runCommand(stopHostProcessesCommand(), 'host-processes', { allowFailure: true });

    console.log('[dev:stop] step 2/2: stopping Docker services...');
    await runCommand('docker compose -f docker/docker-compose.yml down', 'docker', { allowFailure: true });

    console.log('[dev:stop] done.');
  } catch (error) {
    console.error(`[dev:stop] ${error.message}`);
    process.exit(1);
  }
})();
