// Electron shell for the offline desktop build of Firm Automations.
//
// What this does, in order, every time the app launches:
//   1. Point DATABASE_URL at a SQLite file inside this OS user's private
//      app-data folder (never inside the app bundle, so updates don't wipe
//      data, and nothing is shared between machines).
//   2. If that file is brand new (first run), apply the bundled Prisma
//      migration SQL to create all the tables.
//   3. Spawn the Next.js "standalone" production server (built by
//      `next build` with output: 'standalone') as a child process on a
//      local port.
//   4. Open a normal BrowserWindow pointed at that local server.
//
// Nothing here talks to the internet. The whole app -- UI, API routes,
// database -- runs inside this one process tree on the user's machine.

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const http = require('http');

const PORT = 4317;
const isPacked = app.isPackaged;

// The Next standalone server (server.js + its own node_modules + public/
// + .next/static, all merged together by scripts/copy-standalone-assets.js
// after every build) and the Prisma schema/migrations are shipped as
// electron-builder "extraResources" -- a plain directory copy outside
// app.asar entirely, not routed through the asar file-glob filter (which
// silently strips any nested node_modules folder, which is exactly what
// this bundle needs to keep). In dev (unpacked), the equivalent files
// live directly under the project root.
const standaloneBase = isPacked
  ? path.join(process.resourcesPath, 'app')
  : path.join(__dirname, '..', '.next', 'standalone');

const prismaBase = isPacked
  ? path.join(process.resourcesPath, 'prisma')
  : path.join(__dirname, '..', 'prisma');

const userDataDir = app.getPath('userData');
const dbPath = path.join(userDataDir, 'local.db');
const attachmentsDir = path.join(userDataDir, 'attachments');
const secretPath = path.join(userDataDir, '.nextauth-secret');

let serverProcess = null;
let mainWindow = null;

function getOrCreateAuthSecret() {
  if (fs.existsSync(secretPath)) return fs.readFileSync(secretPath, 'utf8').trim();
  const secret = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.writeFileSync(secretPath, secret, { mode: 0o600 });
  return secret;
}

async function ensureDatabase() {
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.mkdirSync(attachmentsDir, { recursive: true });

  const isNewDb = !fs.existsSync(dbPath);
  if (isNewDb) fs.writeFileSync(dbPath, '');

  // Only import PrismaClient after DATABASE_URL is set on process.env. Load
  // it from the Next standalone bundle's own node_modules (Next's build
  // trace already copies @prisma/client + the generated .prisma/client
  // query engine binary in there for the server to use) rather than the
  // project root, so there's exactly one copy of the engine to keep in
  // sync and nothing extra to unpack from the asar.
  process.env.DATABASE_URL = `file:${dbPath}`;
  const { PrismaClient } = require(
    path.join(standaloneBase, 'node_modules', '@prisma', 'client')
  );
  const prisma = new PrismaClient();

  try {
    // Cheap way to tell "does this database already have our tables":
    // try a real query, and if it fails because the table doesn't exist,
    // this is a first run and we need to apply the migration SQL.
    await prisma.user.count();
  } catch (err) {
    const migrationsDir = path.join(prismaBase, 'migrations');
    const migrationFolders = fs
      .readdirSync(migrationsDir)
      .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
      .sort();

    for (const folder of migrationFolders) {
      const sqlPath = path.join(migrationsDir, folder, 'migration.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      // Split on semicolons at end of statement. Our schema has no stored
      // procedures/triggers with embedded semicolons, so this is safe.
      const statements = sql
        .split(/;\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await prisma.$executeRawUnsafe(statement);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Local server did not start in time'));
        } else {
          setTimeout(attempt, 300);
        }
      });
    };
    attempt();
  });
}

function startNextServer() {
  const serverPath = path.join(standaloneBase, 'server.js');

  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      DATABASE_URL: `file:${dbPath}`,
      ATTACHMENTS_DIR: attachmentsDir,
      NEXTAUTH_URL: `http://127.0.0.1:${PORT}`,
      NEXTAUTH_SECRET: getOrCreateAuthSecret(),
      ELECTRON_RUN_AS_NODE: '1'
    },
    cwd: standaloneBase,
    stdio: 'inherit'
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0 && mainWindow) {
      console.error(`Local server exited unexpectedly with code ${code}`);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: 'Firm Automations',
    icon: path.join(standaloneBase, 'public', 'icons', 'icon-512.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  // Open any external link (http/https to a different origin) in the OS
  // browser instead of navigating the desktop app window away from the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${PORT}`)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await ensureDatabase();
    startNextServer();
    await waitForServer(`http://127.0.0.1:${PORT}`);
    createWindow();
  } catch (err) {
    console.error('Failed to start Firm Automations desktop app:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});
