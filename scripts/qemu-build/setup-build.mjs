#!/usr/bin/env node
/*
 * Interactive, host-aware entry point.  It deliberately asks before it
 * installs host software or begins a long, networked build.
 */
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, '..', '..');
const cacheDir = process.env.PC110_WEB_CACHE_DIR ?? path.join(projectDir, '.cache');
const emsdkDir = path.join(cacheDir, 'emsdk');
const stage = process.env.PC110_WEB_BUILD_STAGE ?? 'portable';
const yes = process.argv.includes('--yes');
const prepareOnly = process.argv.includes('--prepare-only');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: projectDir, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
function found(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
}
async function confirm(question) {
  if (yes) return true;
  const io = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await io.question(`${question} [y/N] `)).trim().toLowerCase();
  io.close();
  return answer === 'y' || answer === 'yes';
}
function hostPlan() {
  if (process.platform === 'win32') {
    return {
      label: 'Windows 11 (Git Bash + MSYS2/MinGW)',
      packages: ['make', 'pkgconf', 'gcc'],
      install: ['C:\\msys64\\usr\\bin\\pacman.exe', '-S', '--needed', '--noconfirm', 'make', 'pkgconf', 'mingw-w64-ucrt-x86_64-gcc'],
      needsBash: true,
    };
  }
  if (process.platform === 'darwin') return {
    label: 'macOS (Homebrew)', packages: ['git', 'python3', 'cmake', 'ninja', 'pkg-config', 'autoconf', 'automake', 'libtool'],
    install: ['brew', 'install', 'git', 'python', 'cmake', 'ninja', 'pkg-config', 'autoconf', 'automake', 'libtool'],
  };
  if (process.platform === 'linux') return {
    label: 'Linux (APT)', packages: ['git', 'python3', 'python3-venv', 'cmake', 'ninja-build', 'pkg-config', 'make', 'autoconf', 'automake', 'libtool'],
    install: ['sudo', 'apt-get', 'install', '-y', 'git', 'python3', 'python3-venv', 'cmake', 'ninja-build', 'pkg-config', 'make', 'autoconf', 'automake', 'libtool'],
  };
  throw new Error(`Unsupported host: ${process.platform}`);
}

const plan = hostPlan();
console.log(`PC110 Web setup/build\nHost: ${plan.label}\nCache: ${cacheDir}\nStage: ${stage}`);
console.log('\nThis command may install host packages, clone Emscripten and QEMU, download source archives, and create build outputs under .cache/.');
if (!(await confirm('Continue with the setup plan?'))) process.exit(0);

if (plan.needsBash && !process.env.MSYSTEM) {
  throw new Error('On Windows, run this command from Git Bash. It uses Git Bash for the POSIX build scripts.');
}
if (process.platform === 'win32' && !existsSync('C:\\msys64\\usr\\bin\\pacman.exe')) {
  console.log('\nMSYS2 is needed only for the native host build utilities.');
  console.log('Will run: winget install --id MSYS2.MSYS2 --exact');
  if (!(await confirm('Install MSYS2 now?'))) {
    throw new Error('MSYS2 is required for the Windows dependency build.');
  }
  run('winget', ['install', '--id', 'MSYS2.MSYS2', '--exact', '--accept-source-agreements', '--accept-package-agreements']);
  throw new Error('MSYS2 was installed. Close and reopen Git Bash, then rerun this command.');
}
const missing = ['git', 'python3', 'ninja', 'pkg-config', 'make'].filter((command) => !found(command));
if (missing.length) {
  console.log(`\nMissing host commands: ${missing.join(', ')}`);
  console.log(`Will run: ${plan.install.join(' ')}`);
  if (!(await confirm('Install the listed host packages now?'))) {
    throw new Error('Host prerequisites were not installed. Install them, then rerun this command.');
  }
  run(plan.install[0], plan.install.slice(1));
}
if (!existsSync(path.join(emsdkDir, '.emscripten'))) {
  console.log(`\nWill clone Emscripten SDK into ${emsdkDir}.`);
  if (!(await confirm('Download and activate the Emscripten SDK now?'))) process.exit(0);
  if (!existsSync(path.join(emsdkDir, '.git'))) {
    run('git', ['clone', 'https://github.com/emscripten-core/emsdk.git', emsdkDir]);
  }
  if (process.platform === 'win32') {
    const launcher = path.join(emsdkDir, 'emsdk.bat');
    run('cmd.exe', ['/c', launcher, 'install', 'latest']);
    run('cmd.exe', ['/c', launcher, 'activate', 'latest']);
  } else {
    const launcher = path.join(emsdkDir, 'emsdk');
    run(launcher, ['install', 'latest']);
    run(launcher, ['activate', 'latest']);
  }
}
if (prepareOnly) {
  console.log('\nSetup complete. Re-run without --prepare-only to compile.');
  process.exit(0);
}
console.log('\nStarting the PC110 WASM build. This can take a long time.');
if (!(await confirm('Start compilation?'))) process.exit(0);
run('bash', [path.join(scriptDir, 'run-setup-build.sh'), stage]);
