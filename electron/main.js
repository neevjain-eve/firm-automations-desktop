// Electron shell for the offline desktop build of Firm Automations.
//
// What this does, in order, every time the app launches:
//   1. Point DATABASE_URL at a SQLite file inside this OS user's private
//      app-data folder (never inside the app bundle, so updates don't wipe
//      data, and nothing is shared between machines).
//   2. If that file is brand new (first run), apply the bundled Prisma
//      migration SQL to create all the tables.
//   3. Load the Next.js "standalone" production server (built by
//      `next build` with output: 'standalone') directly in this same
//      process on a local port.
//   4. Open a normal BrowserWindow pointed at that local server.
//
// Nothing here talks to the internet. The whole app -- UI, API routes,
// database -- runs inside this one process on the user's machine.
//
// IMPORTANT: the server used to run as a spawned child process, launched
// via `spawn(process.execPath, [serverPath], { env: { ELECTRON_RUN_AS_NODE:
// '1' } })`. That pattern -- an app re-executing its own binary as a
// generic script runtime -- is a known technique real malware uses to
// hide a payload inside a legitimate-looking Electron binary, and it got
// this exact app flagged and deleted by macOS's on-device malware scanner
// (XProtect) on a real test install, even after stripping the quarantine
// attribute (i.e. a genuine signature/heuristic match, not just the usual
// "unidentified developer" Gatekeeper prompt). Loading the server directly
// in-process via require() instead avoids that pattern entirely -- no
// subprocess, no ELECTRON_RUN_AS_NODE, nothing that looks like a loader.
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
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

  // Set the env vars the standalone server reads on startup, then load it
  // directly into this process -- same effect as `node server.js`, minus
  // the subprocess. Electron's main process is already a full Node.js
  // environment, so there's nothing this needs that a child process would
  // have given it.
  process.env.NODE_ENV = 'production';
  process.env.PORT = String(PORT);
  process.env.HOSTNAME = '127.0.0.1';
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.ATTACHMENTS_DIR = attachmentsDir;
  process.env.NEXTAUTH_URL = `http://127.0.0.1:${PORT}`;
  process.env.NEXTAUTH_SECRET = getOrCreateAuthSecret();

  // The standalone server.js resolves its own asset paths relative to
  // its own directory, but some generated builds also lean on cwd -- match
  // what `node server.js` would have had.
  process.chdir(standaloneBase);
  require(serverPath);
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

// No subprocess to clean up anymore -- the server runs in this process and
// exits when Electron does.
