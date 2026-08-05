#!/usr/bin/env node

/**
 * Fails if application code reintroduces references to the retired legacy
 * backend integration: the "/api/*" REST namespace, the contacts client,
 * or the Contact/contactId domain concept (replaced by follow-ups).
 */

import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..", "src")

const RULES = [
  { pattern: /["'`]\/api\//, message: 'literal "/api/*" route (legacy REST namespace, retired)' },
  { pattern: /\bcontactsApi\b/, message: '"contactsApi" (legacy client, retired)' },
  { pattern: /\bfrom\s+["']@\/lib\/api["']/, message: 'import from "@/lib/api" (retired legacy client directory)' },
  { pattern: /\bContact(Summary|Type|Status|Purpose|ServiceReferralRequest)?\b/, message: '"Contact" legacy type (replaced by FollowUp)' },
  { pattern: /\bcontactId\b/, message: '"contactId" legacy field (replaced by followUpId)' },
]

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      walk(full, files)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full)
    }
  }
  return files
}

const violations = []

for (const file of walk(ROOT)) {
  const relPath = path.relative(process.cwd(), file)
  const lines = readFileSync(file, "utf-8").split("\n")

  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        violations.push(`${relPath}:${i + 1} — ${rule.message}\n    ${line.trim()}`)
      }
    }
  })
}

if (violations.length > 0) {
  console.error("Legacy backend references found:\n")
  console.error(violations.join("\n\n"))
  console.error(`\n${violations.length} violation(s). See MIGRACION_NEST_PENDIENTE.md.`)
  process.exit(1)
}

console.log("No legacy backend references found.")
