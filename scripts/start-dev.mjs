import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const VERSION = '0.24.4';
const pbExe = os.platform() === 'win32' ? 'pocketbase.exe' : 'pocketbase';

// 1. Download PocketBase if not exists
if (!fs.existsSync(pbExe)) {
  console.log(`\n📦 PocketBase binary not found. Downloading v${VERSION}...`);
  
  const platform = os.platform();
  const arch = os.arch();

  let pbPlatform = platform === 'win32' ? 'windows' : platform === 'darwin' ? 'darwin' : 'linux';
  let pbArch = arch === 'x64' ? 'amd64' : arch === 'arm64' ? 'arm64' : arch;

  const url = `https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_${pbPlatform}_${pbArch}.zip`;

  console.log(`Downloading from: ${url}`);
  try {
    execSync(`curl -L -o pb.zip ${url}`, { stdio: 'inherit' });
    
    console.log('📦 Extracting PocketBase...');
    if (platform === 'win32') {
      execSync('powershell -Command "Expand-Archive pb.zip -DestinationPath . -Force"', { stdio: 'inherit' });
    } else {
      execSync('unzip -o pb.zip', { stdio: 'inherit' });
    }
    
    fs.unlinkSync('pb.zip');
    
    if (platform !== 'win32') {
      execSync(`chmod +x ${pbExe}`);
    }
    
    console.log('✅ PocketBase successfully installed!');
  } catch (e) {
    console.error('❌ Failed to download PocketBase. Please download it manually from https://pocketbase.io/docs/', e);
    process.exit(1);
  }
}

// 2. Ensure superuser exists
console.log('\n👤 Ensuring superuser account exists...');
try {
  let email = 'admin@example.com';
  let password = 'password123';
  if (fs.existsSync('.env')) {
    const envFile = fs.readFileSync('.env', 'utf-8');
    const emailMatch = envFile.match(/^POCKETBASE_ADMIN_EMAIL=(.+)$/m);
    const passMatch = envFile.match(/^POCKETBASE_ADMIN_PASSWORD=(.+)$/m);
    if (emailMatch) email = emailMatch[1].trim();
    if (passMatch) password = passMatch[1].trim();
  }
  
  const exeCmd = os.platform() === 'win32' ? `.\\${pbExe}` : `./${pbExe}`;
  execSync(`${exeCmd} superuser upsert ${email} ${password}`, { stdio: 'ignore' });
  console.log('✅ Superuser ready.');
} catch (e) {
  // Ignore errors
}

// 3. Start PocketBase
console.log('\n🚀 Starting PocketBase...');
const pbProcess = spawn(os.platform() === 'win32' ? `.\\${pbExe}` : `./${pbExe}`, ['serve'], { 
  stdio: 'inherit',
  shell: true 
});

// 4. Seed Database (runs concurrently, waits briefly for server to boot)
console.log('\n🌱 Ensuring database schema is seeded...');
setTimeout(() => {
  try {
    execSync('node --env-file=.env scripts/seed-pb.mjs', { stdio: 'ignore' });
    console.log('✅ Database schema verified/seeded.');
  } catch (e) {
    // Already seeded or error
  }
}, 3000);

// 5. Start Next.js
console.log('🚀 Starting Next.js...');
const nextProcess = spawn('npm', ['run', 'dev:next'], { 
  stdio: 'inherit',
  shell: true
});

// Handle termination
const cleanup = () => {
  console.log('\n🛑 Shutting down servers...');
  pbProcess.kill('SIGINT');
  nextProcess.kill('SIGINT');
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
