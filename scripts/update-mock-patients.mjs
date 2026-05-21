#!/usr/bin/env node

/**
 * Updates mock patients:
 *   1. Changes 10 women to "Cáncer de mama"
 *   2. Assigns 5 patients to Hospital Rebagliati
 *   3. Adds historical records with dispersed dates (2024-2026)
 *
 * Usage:
 *   node scripts/update-mock-patients.mjs
 */

const API_URL = process.env.API_URL || "http://178.156.230.233:8084";
const EMAIL = process.env.EMAIL || "admin@gmail.com";
const PASSWORD = process.env.PASSWORD || "123456";

// ─── Helpers ────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function apiFetch(token, path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${options.method || "GET"} ${path} -> ${res.status}: ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Login ──────────────────────────────────────────────────────────────────

async function login() {
  console.log("[login] Authenticating...");
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  console.log(`[login] Logged in as ${data.user?.role}`);
  return data;
}

// ─── Fetch all resources ────────────────────────────────────────────────────

async function fetchAll(token) {
  console.log("[fetch] Loading patients, agents, health-centers...");
  const [patients, agents, hospitals] = await Promise.all([
    apiFetch(token, "/api/patients"),
    apiFetch(token, "/agents"),
    apiFetch(token, "/api/health-centers"),
  ]);

  const rebagliati = hospitals.find((h) =>
    h.name.toLowerCase().includes("rebagliati"),
  );

  if (!rebagliati) throw new Error("Hospital Rebagliati not found!");

  console.log(`[fetch] Patients: ${patients.length}`);
  console.log(`[fetch] Rebagliati ID: ${rebagliati.id} (${rebagliati.name})`);

  return {
    patients,
    agentId: agents[0]?.id,
    rebagliatiId: rebagliati.id,
    hospitals,
  };
}

// ─── Create a contact (needed for diagnosis linking) ────────────────────────

async function createContact(token, patientId, agentId, date, purpose, notes) {
  const scheduledAt = `${date}T10:00:00Z`;
  const completedAt = `${date}T10:15:00Z`;
  const contact = await apiFetch(token, "/api/contacts", {
    method: "POST",
    body: JSON.stringify({
      patientId,
      agentId,
      type: "CALL",
      status: "COMPLETED",
      purpose,
      scheduledAt,
      completedAt,
      notes: notes || null,
    }),
  });
  return contact.id;
}

// ─── Add a diagnosis record ─────────────────────────────────────────────────

async function addDiagnosis(token, patientId, contactId, diagnosis) {
  await apiFetch(token, `/api/patients/${patientId}/diagnoses`, {
    method: "POST",
    body: JSON.stringify(diagnosis),
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== FPC Mock Patient Updater ===\n");

  const { accessToken } = await login();
  const { patients, agentId, rebagliatiId, hospitals } = await fetchAll(accessToken);

  if (!agentId) throw new Error("No agents found!");

  // ── 1. Identify women ──
  // Heuristic: names ending in 'a', or common female names
  const femalePattern = /\b(María|Rosa|Ana|Carmen|Lucía|Diana|Sofía|Patricia|Gladys|Julia|Marisol|Katherine|Gloria|Vilma|Tatiana|Lucía|Ester|Carolina|Isabel|Fernanda|Alejandra|Roxana|Milagros)\b/;

  const women = patients.filter((p) => {
    const parts = p.fullName.split(" ");
    const firstName = parts[0];
    // Check if first name ends in 'a' (typical Spanish feminine) or matches known female names
    return (
      firstName.endsWith("a") ||
      femalePattern.test(p.fullName)
    );
  });

  console.log(`\n[women] Found ${women.length} female patients`);

  // Pick 10 distinct women (avoid ones that already have Cáncer de mama)
  const mamaCandidates = women.filter((p) => {
    const currentDx = p.diagnoses?.find((d) => d.isCurrent)?.diagnosis || "";
    return !currentDx.toLowerCase().includes("mama");
  });

  const toMama = mamaCandidates.slice(0, 10);

  console.log(`[mama] Changing ${toMama.length} patients to Cáncer de mama:`);
  toMama.forEach((p) => console.log(`  - ${p.fullName} (current: ${p.diagnoses?.[0]?.diagnosis || "none"})`));

  // ── 2. Pick 5 for Rebagliati ──
  const rebagliatiCandidates = patients.filter((p) => {
    const currentHospId = p.diagnoses?.find((d) => d.isCurrent)?.healthCenterId;
    return currentHospId !== rebagliatiId;
  });

  const toRebagliati = rebagliatiCandidates.slice(0, 5);

  console.log(`\n[rebagliati] Assigning ${toRebagliati.length} patients to Rebagliati:`);
  toRebagliati.forEach((p) => console.log(`  - ${p.fullName}`));

  // ── 3. Apply changes ──
  const historicalDates = [
    "2024-02-15", "2024-05-20", "2024-08-10", "2024-11-05",
    "2025-01-22", "2025-04-08", "2025-07-14", "2025-09-30",
    "2026-01-12", "2026-03-25",
  ];

  const stages = ["STAGE_1", "STAGE_2", "STAGE_2", "STAGE_3"];

  console.log("\n[apply] Updating patients...\n");

  let updated = 0;
  let errors = 0;

  // ── Update: Cáncer de mama + Rebagliati ──
  // Some patients may be in both groups — handle overlap
  const allUpdates = new Map();

  for (const p of toMama) {
    allUpdates.set(p.id, { ...allUpdates.get(p.id), mama: true, patient: p });
  }
  for (const p of toRebagliati) {
    allUpdates.set(p.id, { ...allUpdates.get(p.id), rebagliati: true, patient: p });
  }

  let idx = 0;
  for (const [patientId, info] of allUpdates) {
    idx++;
    const p = info.patient;
    const date = historicalDates[(idx - 1) % historicalDates.length];

    console.log(`[${idx}/${allUpdates.size}] ${p.fullName}`);

    try {
      // Create contact for this diagnosis update
      const purpose = info.mama ? "FOLLOW_UP" : "ENROLLMENT";
      const notes = info.mama
        ? "Actualización de diagnóstico: confirmado cáncer de mama."
        : "Reasignación a Hospital Rebagliati.";
      const contactId = await createContact(accessToken, patientId, agentId, date, purpose, notes);
      await delay(150);

      // Build diagnosis payload
      const dxName = info.mama ? "Cáncer de mama" : (p.diagnoses?.find((d) => d.isCurrent)?.diagnosis || "Cáncer de mama");
      const hospId = info.rebagliati ? rebagliatiId : (p.diagnoses?.find((d) => d.isCurrent)?.healthCenterId || rebagliatiId);
      const stage = randomItem(stages);

      await addDiagnosis(accessToken, patientId, contactId, {
        diagnosis: dxName,
        cancerStage: stage,
        diagnosisDate: date,
        healthCenterId: hospId,
        isCurrent: true,
        hasMedicalReport: true,
        symptomLeadingToCheckup: "Bulto palpable en seno",
        diagnosisSpecialty: "ONCOLOGY",
        contactId,
      });

      const flags = [];
      if (info.mama) flags.push("CÁNCER DE MAMA");
      if (info.rebagliati) flags.push("REBAGLIATI");

      console.log(`  -> ${flags.join(" + ")} | Stage: ${stage} | Date: ${date}`);
      updated++;
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      errors++;
    }

    await delay(300);
  }

  // ── 4. Add historical contacts to ALL patients (date dispersion) ──
  console.log(`\n[dates] Adding historical FOLLOW_UP contacts to 15 random patients for timeline dispersion...`);

  const shuffled = [...patients].sort(() => Math.random() - 0.5);
  const forHistory = shuffled.slice(0, 15);
  const purposes = ["FOLLOW_UP", "FOLLOW_UP", "FOLLOW_UP", "PSYCHOONCOLOGY_REFERRAL", "ENROLLMENT"];
  const contactDates = [
    "2024-03-10", "2024-06-15", "2024-09-20", "2024-12-01",
    "2025-02-14", "2025-05-08", "2025-08-22", "2025-10-15",
    "2026-01-08", "2026-02-20", "2026-04-05",
  ];
  const contactNotes = [
    "Seguimiento rutinario. Paciente estable.",
    "Control post-tratamiento. Sin novedades.",
    "Llamada de seguimiento mensual.",
    "Coordinación de próxima cita médica.",
    "Verificación de adherencia al tratamiento.",
    "Actualización de datos de contacto.",
  ];

  let historyAdded = 0;
  for (const [i, p] of forHistory.entries()) {
    const date = contactDates[i % contactDates.length];
    const purpose = randomItem(purposes);
    const notes = randomItem(contactNotes);

    try {
      await createContact(accessToken, p.id, agentId, date, purpose, notes);
      historyAdded++;
      await delay(150);
    } catch (e) {
      console.log(`  (!) ${p.fullName}: ${e.message}`);
    }
  }

  console.log(`\n=== UPDATE COMPLETE ===`);
  console.log(`Diagnosis updates: ${updated}`);
  console.log(`Historical contacts added: ${historyAdded}`);
  console.log(`Errors: ${errors}`);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
