import type {
  HealthCenter,
  Patient,
  PsychooncologyAppointment,
} from "@/types";

export type DashboardPeriod = "month" | "year" | "ytd" | "all";

export interface DashboardFilters {
  period: DashboardPeriod;
  year: number;
  month: number;
}

export interface DashboardDataset {
  patients: Patient[];
  appointments: PsychooncologyAppointment[];
  healthCenters: HealthCenter[];
}

export interface DistributionDatum {
  name: string;
  value: number;
  secondary?: string;
}

export interface TrendDatum {
  label: string;
  enrolled: number;
  dropouts: number;
  deceased: number;
  sessions: number;
}

export interface StatDatum {
  label: string;
  value: number;
  tone: "primary" | "muted" | "danger";
}

export interface HospitalRow {
  hospital: string;
  department: string;
  patients: number;
  active: number;
  inactive: number;
}

export interface RegionRow {
  region: string;
  patients: number;
  sessions: number;
}

export interface DashboardSnapshot {
  periodLabel: string;
  cohortPatients: Patient[];
  cohortAppointments: PsychooncologyAppointment[];
  totalPatients: number;
  enrolledCount: number;
  activeCount: number;
  inactiveCount: number;
  inferredDeceasedCount: number;
  dropOutCount: number;
  psychoSessionsCount: number;
  completionRate: number;
  averageSessionsPerPatient: number;
  completionMix: StatDatum[];
  neoplasiaDistribution: DistributionDatum[];
  hospitalDistribution: DistributionDatum[];
  enrollmentTrend: TrendDatum[];
  sessionStatusDistribution: DistributionDatum[];
  sessionModalityDistribution: DistributionDatum[];
  sessionRegionDistribution: DistributionDatum[];
  patientRegionDistribution: DistributionDatum[];
  hospitalRows: HospitalRow[];
  regionRows: RegionRow[];
}

interface PatientHospitalInfo {
  name: string;
  department: string;
}

const monthFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "short",
  year: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
});

const fullMonthFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "long",
  year: "numeric",
});

const fullYearFormatter = new Intl.DateTimeFormat("es-PE", {
  year: "numeric",
});

const deceasedRegex =
  /\b(falleci[oó]|fallecid[ao]s?|murio|muri[oó]|deceso|obito|óbito|deceased)\b/i;

export function getAvailableYears(dataset?: DashboardDataset): number[] {
  if (!dataset) return [];

  const years = new Set<number>();

  for (const patient of dataset.patients) {
    const year = safeParseDate(patient.createdAt)?.getFullYear();
    if (year) years.add(year);
  }

  for (const appointment of dataset.appointments) {
    const year = safeParseDate(appointment.scheduledAt)?.getFullYear();
    if (year) years.add(year);
  }

  return [...years].sort((a, b) => b - a);
}

export function buildDashboardSnapshot(
  dataset: DashboardDataset,
  filters: DashboardFilters,
): DashboardSnapshot {
  const now = new Date();
  const centersById = new Map(dataset.healthCenters.map((center) => [center.id, center]));
  const appointmentsByPatient = groupAppointmentsByPatient(dataset.appointments);
  const period = getPeriodRange(filters, dataset, now);

  const cohortPatients = dataset.patients.filter((patient) =>
    isWithinRange(patient.createdAt, period.start, period.end),
  );
  const cohortAppointments = dataset.appointments.filter((appointment) =>
    isWithinRange(appointment.scheduledAt, period.start, period.end),
  );

  const enrolledPatients = cohortPatients.filter(isEnrolledPatient);
  const activePatients = cohortPatients.filter((patient) =>
    patient.status === "ACTIVE" || patient.status === "ENROLLED",
  );
  const inactivePatients = cohortPatients.filter((patient) => patient.status === "INACTIVE");
  const inferredDeceasedPatients = inactivePatients.filter((patient) =>
    inferDeceased(patient, appointmentsByPatient.get(patient.id) ?? []),
  );

  const neoplasiaDistribution = aggregateDistribution(
    enrolledPatients.map((patient) => primaryDiagnosis(patient) ?? "Sin neoplasia registrada"),
    6,
  );

  const hospitalDistribution = aggregateDistribution(
    enrolledPatients.map(
      (patient) => inferPatientHospital(patient, centersById)?.name ?? "Sin hospital asociado",
    ),
    6,
  );

  const patientRegionDistribution = aggregateDistribution(
    enrolledPatients.map(
      (patient) =>
        inferPatientRegion(patient, centersById) ?? "Sin región consignada",
    ),
    6,
  );

  const sessionStatusDistribution = aggregateDistribution(
    cohortAppointments.map((appointment) => appointmentStatusLabel(appointment.status)),
    4,
  );

  const sessionModalityDistribution = aggregateDistribution(
    cohortAppointments.map((appointment) => appointmentModalityLabel(appointment.modality)),
    3,
  );

  const sessionRegionDistribution = aggregateDistribution(
    cohortAppointments.map((appointment) => {
      const patient = dataset.patients.find((item) => item.id === appointment.patientId);
      return patient
        ? inferPatientRegion(patient, centersById) ?? "Sin región consignada"
        : "Sin región consignada";
    }),
    6,
  );

  const enrollmentTrend = buildTrend(
    filters,
    dataset.patients,
    dataset.appointments,
    appointmentsByPatient,
    now,
  );

  const hospitalRows = buildHospitalRows(enrolledPatients, centersById);
  const regionRows = buildRegionRows(enrolledPatients, cohortAppointments, centersById);
  const completionRate = percentage(
    cohortAppointments.filter((appointment) => appointment.status === "COMPLETED").length,
    cohortAppointments.length,
  );
  const averageSessionsPerPatient = cohortPatients.length
    ? Number((cohortAppointments.length / cohortPatients.length).toFixed(1))
    : 0;

  return {
    periodLabel: period.label,
    cohortPatients,
    cohortAppointments,
    totalPatients: cohortPatients.length,
    enrolledCount: enrolledPatients.length,
    activeCount: activePatients.length,
    inactiveCount: inactivePatients.length,
    inferredDeceasedCount: inferredDeceasedPatients.length,
    dropOutCount: inactivePatients.length,
    psychoSessionsCount: cohortAppointments.length,
    completionRate,
    averageSessionsPerPatient,
    completionMix: [
      { label: "Enrolados", value: enrolledPatients.length, tone: "primary" },
      { label: "Fallecidos", value: inferredDeceasedPatients.length, tone: "danger" },
      { label: "Drop-outs", value: inactivePatients.length, tone: "muted" },
    ],
    neoplasiaDistribution,
    hospitalDistribution,
    enrollmentTrend,
    sessionStatusDistribution,
    sessionModalityDistribution,
    sessionRegionDistribution,
    patientRegionDistribution,
    hospitalRows,
    regionRows,
  };
}

function buildHospitalRows(
  patients: Patient[],
  centersById: Map<string, HealthCenter>,
): HospitalRow[] {
  const hospitalMap = new Map<string, HospitalRow>();

  for (const patient of patients) {
    const info = inferPatientHospital(patient, centersById) ?? {
      name: "Sin hospital asociado",
      department: "Sin región",
    };

    const current = hospitalMap.get(info.name) ?? {
      hospital: info.name,
      department: info.department,
      patients: 0,
      active: 0,
      inactive: 0,
    };

    current.patients += 1;
    if (patient.status === "INACTIVE") {
      current.inactive += 1;
    } else {
      current.active += 1;
    }

    hospitalMap.set(info.name, current);
  }

  return [...hospitalMap.values()]
    .sort((a, b) => b.patients - a.patients)
    .slice(0, 8);
}

function buildRegionRows(
  patients: Patient[],
  appointments: PsychooncologyAppointment[],
  centersById: Map<string, HealthCenter>,
): RegionRow[] {
  const rows = new Map<string, RegionRow>();
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));

  for (const patient of patients) {
    const region = inferPatientRegion(patient, centersById) ?? "Sin región consignada";
    const row = rows.get(region) ?? { region, patients: 0, sessions: 0 };
    row.patients += 1;
    rows.set(region, row);
  }

  for (const appointment of appointments) {
    const patient = patientById.get(appointment.patientId);
    const region = patient
      ? inferPatientRegion(patient, centersById) ?? "Sin región consignada"
      : "Sin región consignada";
    const row = rows.get(region) ?? { region, patients: 0, sessions: 0 };
    row.sessions += 1;
    rows.set(region, row);
  }

  return [...rows.values()]
    .sort((a, b) => b.sessions - a.sessions || b.patients - a.patients)
    .slice(0, 8);
}

function buildTrend(
  filters: DashboardFilters,
  patients: Patient[],
  appointments: PsychooncologyAppointment[],
  appointmentsByPatient: Map<string, PsychooncologyAppointment[]>,
  now: Date,
): TrendDatum[] {
  const range = getPeriodRange(filters, { patients, appointments, healthCenters: [] }, now);
  const buckets = createBuckets(filters, range.start, range.end);

  for (const patient of patients) {
    if (!isEnrolledPatient(patient)) continue;

    const createdAt = safeParseDate(patient.createdAt);
    if (createdAt && isDateInsideBucketWindow(createdAt, range.start, range.end)) {
      const key = bucketKey(createdAt, buckets.kind);
      const bucket = buckets.index.get(key);
      if (bucket) bucket.enrolled += 1;
    }

    if (patient.status === "INACTIVE") {
      const inactiveAt = safeParseDate(patient.updatedAt);
      if (inactiveAt && isDateInsideBucketWindow(inactiveAt, range.start, range.end)) {
        const key = bucketKey(inactiveAt, buckets.kind);
        const bucket = buckets.index.get(key);
        if (bucket) {
          bucket.dropouts += 1;
          if (inferDeceased(patient, appointmentsByPatient.get(patient.id) ?? [])) {
            bucket.deceased += 1;
          }
        }
      }
    }
  }

  for (const appointment of appointments) {
    const scheduledAt = safeParseDate(appointment.scheduledAt);
    if (!scheduledAt || !isDateInsideBucketWindow(scheduledAt, range.start, range.end)) {
      continue;
    }
    const key = bucketKey(scheduledAt, buckets.kind);
    const bucket = buckets.index.get(key);
    if (bucket) bucket.sessions += 1;
  }

  return buckets.values.map(({ key: _key, ...datum }) => datum);
}

function createBuckets(
  filters: DashboardFilters,
  start: Date,
  end: Date,
): {
  kind: "day" | "month";
  values: Array<{ key: string } & TrendDatum>;
  index: Map<string, { key: string } & TrendDatum>;
} {
  const kind = filters.period === "month" ? "day" : "month";
  const cursor = new Date(start);
  const values: Array<{ key: string } & TrendDatum> = [];

  while (cursor <= end) {
    const key = bucketKey(cursor, kind);
    values.push({
      key,
      label: kind === "day" ? dayFormatter.format(cursor) : monthFormatter.format(cursor),
      enrolled: 0,
      dropouts: 0,
      deceased: 0,
      sessions: 0,
    });

    if (kind === "day") {
      cursor.setDate(cursor.getDate() + 1);
    } else {
      cursor.setMonth(cursor.getMonth() + 1, 1);
    }
  }

  return {
    kind,
    values,
    index: new Map(values.map((value) => [value.key, value])),
  };
}

function getPeriodRange(
  filters: DashboardFilters,
  dataset: DashboardDataset,
  now: Date,
): { start: Date; end: Date; label: string } {
  const year = filters.year;
  const month = filters.month;

  if (filters.period === "month") {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end, label: fullMonthFormatter.format(start) };
  }

  if (filters.period === "year") {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { start, end, label: fullYearFormatter.format(start) };
  }

  if (filters.period === "ytd") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { start, end: now, label: "Año en curso" };
  }

  const dates = [
    ...dataset.patients.map((patient) => safeParseDate(patient.createdAt)),
    ...dataset.appointments.map((appointment) => safeParseDate(appointment.scheduledAt)),
  ].filter((date): date is Date => Boolean(date));

  const start = dates.length
    ? new Date(Math.min(...dates.map((date) => date.getTime())))
    : new Date(now.getFullYear(), 0, 1);

  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  return { start, end: now, label: "Desde el comienzo" };
}

function aggregateDistribution(values: string[], maxItems: number): DistributionDatum[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (sorted.length <= maxItems) {
    return sorted;
  }

  const head = sorted.slice(0, maxItems);
  const tailValue = sorted.slice(maxItems).reduce((sum, item) => sum + item.value, 0);
  return [...head, { name: "Otros", value: tailValue }];
}

function groupAppointmentsByPatient(
  appointments: PsychooncologyAppointment[],
): Map<string, PsychooncologyAppointment[]> {
  const map = new Map<string, PsychooncologyAppointment[]>();

  for (const appointment of appointments) {
    const current = map.get(appointment.patientId) ?? [];
    current.push(appointment);
    map.set(appointment.patientId, current);
  }

  return map;
}

function inferPatientHospital(
  patient: Patient,
  centersById: Map<string, HealthCenter>,
): PatientHospitalInfo | null {
  const diagnosis = pickCurrent(patient.diagnoses);
  const treatment = pickCurrent(patient.treatments);
  const medicalAppointment = [...patient.medicalAppointments].sort((a, b) =>
    (b.appointmentDate ?? b.createdAt).localeCompare(a.appointmentDate ?? a.createdAt),
  )[0];

  const candidates = [
    diagnosis
      ? {
          id: diagnosis.healthCenterId,
          name: diagnosis.healthCenterName,
        }
      : null,
    treatment
      ? {
          id: treatment.healthCenterId,
          name: treatment.healthCenterName,
        }
      : null,
    medicalAppointment
      ? {
          id: medicalAppointment.healthCenterId,
          name: medicalAppointment.healthCenterName,
        }
      : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!candidate?.name) continue;
    const center = candidate.id ? centersById.get(candidate.id) : undefined;
    return {
      name: candidate.name,
      department: center ? formatDepartment(center.department) : "Sin región",
    };
  }

  return null;
}

function inferPatientRegion(
  patient: Patient,
  centersById: Map<string, HealthCenter>,
): string | null {
  const hospital = inferPatientHospital(patient, centersById);
  if (hospital?.department && hospital.department !== "Sin región") {
    return hospital.department;
  }

  if (patient.details?.currentDepartment) {
    return formatDepartment(patient.details.currentDepartment);
  }

  if (patient.details?.birthDepartment) {
    return formatDepartment(patient.details.birthDepartment);
  }

  return null;
}

function primaryDiagnosis(patient: Patient): string | null {
  return pickCurrent(patient.diagnoses)?.diagnosis ?? patient.diagnoses[0]?.diagnosis ?? null;
}

function pickCurrent<T extends { isCurrent?: boolean | null }>(items: T[]): T | undefined {
  return items.find((item) => item.isCurrent) ?? items[0];
}

function inferDeceased(
  patient: Patient,
  appointments: PsychooncologyAppointment[],
): boolean {
  const contactNotes = patient.contacts
    .map((contact) => contact.notes)
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const appointmentNotes = appointments
    .flatMap((appointment) => [
      appointment.topicAddressed,
      appointment.sessionDetails,
      appointment.additionalObservations,
      appointment.recommendations,
    ])
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return deceasedRegex.test(`${contactNotes} ${appointmentNotes}`);
}

function isEnrolledPatient(patient: Patient): boolean {
  return patient.status !== "PROSPECT";
}

function safeParseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isWithinRange(
  value: string | null | undefined,
  start: Date,
  end: Date,
): boolean {
  const date = safeParseDate(value);
  if (!date) return false;
  return isDateInsideBucketWindow(date, start, end);
}

function isDateInsideBucketWindow(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function bucketKey(date: Date, kind: "day" | "month"): string {
  return kind === "day"
    ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    : `${date.getFullYear()}-${date.getMonth()}`;
}

function formatDepartment(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function appointmentStatusLabel(value: PsychooncologyAppointment["status"]): string {
  switch (value) {
    case "COMPLETED":
      return "Completadas";
    case "NO_ANSWER":
      return "Sin respuesta";
    case "CANCELLED":
      return "Canceladas";
    case "SCHEDULED":
    default:
      return "Agendadas";
  }
}

function appointmentModalityLabel(value: PsychooncologyAppointment["modality"]): string {
  return value === "VIDEO_CALL" ? "Videollamada" : "Llamada";
}

function percentage(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}
