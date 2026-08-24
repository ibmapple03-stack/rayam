import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";
const viewportArg = process.argv[4] || "1440x900"; // WIDTHxHEIGHT, use e.g. 390x844 for mobile

const [width, height] = viewportArg.split("x").map(Number);

const outDir = path.join(__dirname, "temporary_screenshots");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// auto-increment
let n = 1;
const existing = fs.readdirSync(outDir).filter(f => /^screenshot-(\d+)/.test(f));
if (existing.length) {
  n = Math.max(...existing.map(f => parseInt(f.match(/^screenshot-(\d+)/)[1], 10))) + 1;
}
const fileName = `screenshot-${n}${label ? "-" + label : ""}.png`;
const outPath = path.join(outDir, fileName);

const systemChromePaths = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];
const executablePath = systemChromePaths.find((p) => fs.existsSync(p));

const browser = await puppeteer.launch({
  headless: "new",
  ...(executablePath ? { executablePath } : {}),
});
const page = await browser.newPage();
await page.setViewport({ width: width || 1440, height: height || 900 });
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
// let animations / lazy content settle
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: ${outPath}`);
