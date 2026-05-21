#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_URL = process.env.API_URL || "http://178.156.230.233:8083";
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("❌ TOKEN environment variable is required.");
  console.error("Usage: TOKEN=your-jwt-token node scripts/seed-hospitales.mjs");
  process.exit(1);
}

const hospitals = JSON.parse(
  readFileSync(resolve(__dirname, "hospitales.json"), "utf-8")
);

console.log(`\n🏥 Seeding ${hospitals.length} hospitals to ${API_URL}/api/health-centers\n`);

let created = 0;
let skipped = 0;
let errors = [];

for (let i = 0; i < hospitals.length; i++) {
  const h = hospitals[i];
  const label = `[${i + 1}/${hospitals.length}]`;

  try {
    const res = await fetch(`${API_URL}/api/health-centers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ name: h.name, department: h.department }),
    });

    if (res.ok) {
      console.log(`  ✅ ${label} ${h.name} (${h.department})`);
      created++;
    } else if (res.status === 409) {
      console.log(`  ⏭️  ${label} ${h.name} — ya existe (skipped)`);
      skipped++;
    } else {
      const body = await res.json().catch(() => ({}));
      const msg = body.message || body.error || res.statusText;
      console.error(`  ❌ ${label} ${h.name} — ${msg}`);
      errors.push({ name: h.name, status: res.status, message: msg });
    }
  } catch (err) {
    console.error(`  💥 ${label} ${h.name} — network error: ${err.message}`);
    errors.push({ name: h.name, message: err.message });
  }

  // Small delay between requests to avoid hammering the server
  if (i < hospitals.length - 1) {
    await new Promise((r) => setTimeout(r, 300));
  }
}

console.log(`\n📊 Results:`);
console.log(`  ✅ Created: ${created}`);
console.log(`  ⏭️  Skipped (duplicates): ${skipped}`);
console.log(`  ❌ Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log(`\n🛑 Error details:`);
  for (const e of errors) {
    console.log(`  - ${e.name}: ${e.message}`);
  }
}

console.log();
