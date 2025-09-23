#!/usr/bin/env node
import fs from "fs";
import path from "path";
import url from "url";
import os from "os";
import sharp from "sharp";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const QUALITY = parseInt(process.env.IMG_WEBP_QUALITY || "80", 10);
const TARGET_SIZES = [320, 640, 768, 1024, 1280, 1920];
const EXTS = new Set([".jpg", ".jpeg", ".png"]);

const INPUT_DIRS = [
  path.join(projectRoot, "public"),
  path.join(projectRoot, "client", "assets"),
];

function* walk(dir) {
  const entries = fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true })
    : [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

async function processImage(file) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTS.has(ext)) return false;

  const base = file.slice(0, -ext.length);

  try {
    const img = sharp(file);
    const metadata = await img.metadata();

    const tasks = [];

    // Convert original to WebP
    const webpPath = `${base}.webp`;
    if (!fs.existsSync(webpPath)) {
      tasks.push(img.clone().webp({ quality: QUALITY }).toFile(webpPath));
    }

    // Generate responsive sizes (WebP)
    const sizes = TARGET_SIZES.filter(
      (s) => !metadata.width || s < metadata.width,
    );
    for (const size of sizes) {
      const sizedWebpPath = `${base}_${size}w.webp`;
      if (!fs.existsSync(sizedWebpPath)) {
        tasks.push(
          img
            .clone()
            .resize({ width: size, withoutEnlargement: true })
            .webp({ quality: QUALITY })
            .toFile(sizedWebpPath),
        );
      }
      const sizedFallbackPath = `${base}_${size}w${ext}`;
      if (!fs.existsSync(sizedFallbackPath)) {
        tasks.push(
          img
            .clone()
            .resize({ width: size, withoutEnlargement: true })
            .toFile(sizedFallbackPath),
        );
      }
    }

    await Promise.all(tasks);
    return true;
  } catch (err) {
    console.warn(`[optimize-images] Failed to process ${file}:`, err.message);
    return false;
  }
}

async function main() {
  const cpuCount = os.cpus()?.length || 4;
  const queue = [];

  for (const dir of INPUT_DIRS) {
    for (const file of walk(dir)) {
      queue.push(file);
    }
  }

  let processed = 0;
  let converted = 0;

  const workers = Array.from({ length: Math.min(cpuCount, 8) }, async () => {
    while (queue.length) {
      const file = queue.pop();
      if (!file) break;
      const did = await processImage(file);
      processed++;
      if (did) converted++;
      if (processed % 10 === 0) {
        process.stdout.write(
          `\r[optimize-images] Processed ${processed}, converted ${converted}`,
        );
      }
    }
  });

  await Promise.all(workers);
  process.stdout.write(
    `\n[optimize-images] Done. Processed ${processed}, converted ${converted}.\n`,
  );
}

main().catch((e) => {
  console.error("[optimize-images] Fatal error:", e);
  process.exit(1);
});
