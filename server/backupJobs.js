const { exec } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const cron = require("node-cron");
require("dotenv").config();

const { HOST, USER, PASSWORD, DATABASE } = process.env;

const BACKUP_DIR = path.join(__dirname, "db_backups");
const BACKUP_TIME_CRON = "0 22 * * *";

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

function backupFileName() {
    const now = new Date();
    const stamp = now
        .toISOString()
        .slice(0, 16)
        .replace("T", "_")
        .replace(":", "-");
    return `${DATABASE}_${stamp}.sql`;
}

function runMysqlDump(outPath) {
    return new Promise((resolve, reject) => {
        const cmd = [
            "mysqldump",
            `-h${HOST}`,
            `-u${USER}`,
            `-p${PASSWORD}`,
            "--single-transaction",
            "--routines",
            "--triggers",
            DATABASE,
            `> "${outPath}"`,
        ].join(" ");

        exec(cmd, { shell: "/bin/bash" }, (err) => {
            if (err) return reject(err);
            resolve(outPath);
        });
    });
}

async function purgeOldBackups(dir, days = 7) {
    const now = Date.now();
    const limitMs = days * 24 * 60 * 60 * 1000;
    const files = await fs.readdir(dir);

    for (const file of files) {
        if (!file.endsWith(".sql")) continue;
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (now - stat.mtimeMs > limitMs) {
            await fs.unlink(filePath);
            console.log(`[backup] Deleted old backup: ${filePath}`);
        }
    }
}

async function doBackupOnce() {
    await ensureDir(BACKUP_DIR);
    const filePath = path.join(BACKUP_DIR, backupFileName());
    console.log(`[backup] Starting backup -> ${filePath}`);
    const donePath = await runMysqlDump(filePath);
    console.log(`[backup] Backup complete: ${donePath}`);
    await purgeOldBackups(BACKUP_DIR, 7);
}

function scheduleDailyBackups() {
    cron.schedule(
        BACKUP_TIME_CRON,
        async () => {
            try {
                await doBackupOnce();
            } catch (err) {
                console.error("[backup] Backup job failed:", err.message);
            }
        },
        { timezone: "Asia/Kolkata" }
    );
    console.log(`[backup] Daily backups scheduled at "${BACKUP_TIME_CRON}"`);
}

module.exports = { doBackupOnce, scheduleDailyBackups };
