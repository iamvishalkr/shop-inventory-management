#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server root is the parent of scripts/
const serverDir = path.resolve(__dirname, "..");
// Workspace root is parent of server/
const rootDir = path.resolve(serverDir, "..");
const clientDir = path.resolve(rootDir, "client");
const clientOutDir = path.resolve(clientDir, "out");
const serverPublicDir = path.resolve(serverDir, "public");

// Parse CLI arguments
const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : null;
};

const shouldCommit = hasFlag("commit");
const shouldPush = hasFlag("push");
const commitMessage = getArgValue("message") || "chore(deploy): update client production build for Render";

console.log("\n========================================================");
console.log("   🚀 Deploy Preparation: Next.js SSG -> Express Server");
console.log("========================================================\n");

// 1. Detect Production Backend URL
function readEnvValue(filePath, key) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  const line = content
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith(`${key}=`));
  if (!line) return null;
  const val = line.substring(key.length + 1).trim();
  // Remove wrapping quotes if present
  return val.replace(/^["']|["']$/g, "");
}

const customUrl = getArgValue("backend-url");
const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const prodEnvUrl = readEnvValue(path.join(clientDir, ".env.production"), "NEXT_PUBLIC_BACKEND_URL");
const defaultEnvUrl = readEnvValue(path.join(clientDir, ".env"), "NEXT_PUBLIC_BACKEND_URL");
const fallbackUrl = "https://shop-inventory-management-tf5j.onrender.com";

const backendUrl = customUrl || envUrl || prodEnvUrl || defaultEnvUrl || fallbackUrl;

console.log(`📍 Client Directory:        ${clientDir}`);
console.log(`📍 Server Public Directory:  ${serverPublicDir}`);
console.log(`🌐 Production Backend URL:   ${backendUrl}`);
console.log("--------------------------------------------------------\n");

// 2. Build Client
console.log("📦 [1/3] Building Next.js static export (client)...");

// Run a command with stdio inherited cleanly across platforms
function runCommand(command, options = {}) {
  return spawnSync(command, {
    stdio: "inherit",
    shell: true,
    ...options,
  });
}

// Prefer pnpm if available, else fallback to npm
const isWindows = process.platform === "win32";
const pnpmCmd = isWindows ? "pnpm.cmd" : "pnpm";
const npmCmd = isWindows ? "npm.cmd" : "npm";

let packageRunner = "pnpm";
try {
  const pnpmCheck = spawnSync(pnpmCmd, ["--version"], { stdio: "ignore" });
  if (pnpmCheck.status !== 0) {
    packageRunner = "npm";
  }
} catch {
  packageRunner = "npm";
}

const buildEnv = {
  ...process.env,
  NODE_ENV: "production",
  NEXT_PUBLIC_BACKEND_URL: backendUrl,
};

const buildResult = runCommand(`${packageRunner} run build`, {
  cwd: clientDir,
  env: buildEnv,
});

if (buildResult.status !== 0) {
  console.error("\n❌ Client build failed! Aborting deploy preparation.");
  process.exit(buildResult.status ?? 1);
}

// 3. Verify client/out exists
if (!fs.existsSync(clientOutDir) || !fs.existsSync(path.join(clientOutDir, "index.html"))) {
  console.error(`\n❌ Error: client/out does not contain index.html at ${clientOutDir}`);
  process.exit(1);
}

// 4. Clean server/public and copy out
console.log("\n🧹 [2/3] Cleaning server/public and copying new static files...");
try {
  if (fs.existsSync(serverPublicDir)) {
    fs.rmSync(serverPublicDir, { recursive: true, force: true });
  }
  fs.mkdirSync(serverPublicDir, { recursive: true });
  fs.cpSync(clientOutDir, serverPublicDir, { recursive: true });
  console.log("✅ Successfully copied client build to server/public!");
} catch (err) {
  console.error("❌ Failed to copy build files:", err);
  process.exit(1);
}

// 5. Git Status & Optional Git Operations
console.log("\n🔍 [3/3] Staging changes in git...");
try {
  // Stage server/public so deletions and additions are tracked
  const relPath = path.relative(rootDir, serverPublicDir).replace(/\\/g, "/");
  runCommand(`git add "${relPath}"`, { cwd: rootDir });

  if (shouldCommit || shouldPush) {
    console.log(`\n💾 Committing changes: "${commitMessage}"...`);
    const commitResult = runCommand(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      cwd: rootDir,
    });

    if (commitResult.status !== 0) {
      console.warn("⚠️ Git commit returned non-zero (maybe no changes were detected).");
    }

    if (shouldPush) {
      console.log("\n🚀 Pushing to GitHub (origin)...");
      const pushResult = runCommand("git push", { cwd: rootDir });

      if (pushResult.status === 0) {
        console.log("\n🎉 Pushed successfully! Render CI/CD will now deploy your update.");
      } else {
        console.error("\n❌ Git push failed. Please push manually.");
      }
    }
  } else {
    console.log("\n========================================================");
    console.log("   ✅ SUCCESS: server/public is ready for deployment!");
    console.log("========================================================");
    console.log("The static client files are staged. Complete the deployment with:");
    console.log(`  git commit -m "chore: deploy update"`);
    console.log(`  git push\n`);
    console.log("💡 Shortcut options available:");
    console.log("  pnpm run deploy:prepare --commit");
    console.log("  pnpm run deploy:prepare --commit --push");
    console.log("========================================================\n");
  }
} catch (err) {
  console.error("⚠️ Git staging error:", err.message);
}
