import { expect, test, type Locator, type Page } from "@playwright/test"
import {
  HISTORICAL_AGENT_ID,
  HISTORICAL_AGENT_NAME,
  HISTORICAL_PATIENT_ID,
  mockHistoricalApi,
  openHistoricalPatient,
  type HistoricalApiCapture,
} from "./helpers"

const ENGLISH_ERROR = /Unknown |must be a valid ISO|must match/

function followUpDialog(page: Page) {
  return page.getByRole("dialog", { name: "Agregar seguimiento histórico" })
}

async function openFollowUpDialog(page: Page) {
  await page.getByRole("button", { name: "Agregar seguimiento" }).click()
  await expect(followUpDialog(page)).toBeVisible()
}

function fieldGroup(
  page: Page,
  container: Locator,
  label: string | RegExp,
) {
  return container
    .locator("div.flex.flex-col.gap-2, div.space-y-2")
    .filter({ has: page.getByText(label) })
    .first()
}

async function chooseLabeled(
  page: Page,
  container: Locator,
  label: string | RegExp,
  option: string | RegExp,
) {
  await fieldGroup(page, container, label).getByRole("combobox").click()
  const listbox = page.getByRole("listbox").last()
  await listbox.waitFor({ state: "visible" })
  await listbox.getByRole("option", { name: option }).click({ force: true })
}

async function fillScheduledOn(
  page: Page,
  container: Locator = followUpDialog(page),
) {
  const input = fieldGroup(page, container, "Fecha programada").locator(
    'input[type="date"]',
  )
  await input.evaluate((element, value) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set
    setter?.call(element, value)
    element.dispatchEvent(new Event("input", { bubbles: true }))
    element.dispatchEvent(new Event("change", { bubbles: true }))
  }, "2024-06-15")
}

async function fillMetadata(page: Page) {
  const dialog = followUpDialog(page)
  await fillScheduledOn(page, dialog)
  await chooseLabeled(page, dialog, /Agente responsable/, HISTORICAL_AGENT_NAME)
}

async function saveFollowUp(page: Page) {
  await followUpDialog(page)
    .getByRole("button", { name: "Guardar seguimiento", exact: true })
    .click()
}

async function expectSaved(page: Page) {
  await expect(page.getByText("Seguimiento histórico guardado")).toBeVisible()
  await expect(followUpDialog(page)).toHaveCount(0)
  await expect(page.getByText(ENGLISH_ERROR)).toHaveCount(0)
}

function lastFollowUp(capture: HistoricalApiCapture) {
  const body = capture.followUps.at(-1)
  expect(body).toBeTruthy()
  return body as Record<string, unknown>
}

function expectBasePayload(body: Record<string, unknown>) {
  expect(body.subjectPatientId).toBe(HISTORICAL_PATIENT_ID)
  expect(body.interlocutorId).toBe(HISTORICAL_PATIENT_ID)
  expect(body.agentId).toBe(HISTORICAL_AGENT_ID)
  expect(body.type).toBe("CALL")
  expect(body.purpose).toBe("FOLLOW_UP")
  expect(body.status).toBe("COMPLETED")
  expect(body.scheduledOn).toBe("2024-06-15")
}

async function openTab(page: Page, name: string) {
  await followUpDialog(page).getByRole("tab", { name }).click()
}

async function addDiagnosisDraft(page: Page) {
  const dialog = followUpDialog(page)
  await openTab(page, "Diagnóstico")
  await dialog.getByText("Agregar o reemplazar diagnóstico").click()
  const form = page.getByRole("dialog", { name: "Nuevo diagnóstico" })
  await expect(form).toBeVisible()
  await chooseLabeled(page, form, /^Diagnóstico$/, "Cáncer de mama")
  await form.getByRole("button", { name: "Guardar en borrador" }).click()
  await expect(form).toHaveCount(0)
  await expect(dialog.getByText("Cáncer de mama")).toBeVisible()
}

async function addTreatmentDraft(page: Page) {
  const dialog = followUpDialog(page)
  await openTab(page, "Tratamientos")
  await dialog.getByText("Agregar o reemplazar tratamiento").click()
  const form = page.getByRole("dialog", { name: "Nuevo tratamiento" })
  await expect(form).toBeVisible()
  await chooseLabeled(page, form, "Diagnóstico asociado", /Cáncer de mama/)
  await chooseLabeled(page, form, "Tipo de tratamiento", "Quimioterapia")
  await form.getByRole("button", { name: "Guardar en borrador" }).click()
  await expect(form).toHaveCount(0)
}

test.describe("seguimiento histórico", () => {
  test("guarda metadatos sin bloques clínicos", async ({ page }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.details).toBeUndefined()
    expect(body.diagnoses).toBeUndefined()
    expect(body.treatments).toBeUndefined()
    expect(body.symptomReport).toBeUndefined()
    expect(body.addresses).toBeUndefined()
    expect(body.insurance).toBeUndefined()
    expect(body.socialNotes).toBeUndefined()
  })

  test("guarda datos clínicos", async ({ page }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await openTab(page, "Datos clínicos")
    await followUpDialog(page)
      .getByRole("checkbox", { name: "Requiere traducción" })
      .click()
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar datos generales" })
      .click()
    await expect(
      page.getByText("Datos generales guardados en el borrador"),
    ).toBeVisible()
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.details).toMatchObject({ requiresTranslation: true })
  })

  test("guarda síntomas sin fechas ISO vacías", async ({ page }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await openTab(page, "Síntomas")
    await chooseLabeled(
      page,
      followUpDialog(page),
      "¿Presenta malestar o dolor?",
      "Sí",
    )
    await followUpDialog(page)
      .getByPlaceholder("Describe los signos o síntomas...")
      .fill("Dolor persistente")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar síntomas" })
      .click()
    await expect(
      page.getByText("Síntomas guardados en el borrador histórico"),
    ).toBeVisible()
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    const report = body.symptomReport as Record<string, unknown>
    expect(report.hasDiscomfort).toBe(true)
    expect(report).not.toHaveProperty("firstConsultationDate")
    expect(report).not.toHaveProperty("nextConsultationDate")
  })

  test("guarda una dirección", async ({ page }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await openTab(page, "Direcciones")
    await followUpDialog(page)
      .getByPlaceholder("Av. Principal 123")
      .fill("Jr. Cusco 100")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar dirección" })
      .click()
    await expect(page.getByText("Dirección guardada en el borrador")).toBeVisible()
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.addresses).toEqual(
      expect.arrayContaining([expect.objectContaining({ address: "Jr. Cusco 100" })]),
    )
  })

  test("guarda el contacto del paciente y lo usa como interlocutor", async ({
    page,
  }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await openTab(page, "Contacto")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar contacto" })
      .click()
    await expect(
      page.getByText("Contacto guardado en el borrador del seguimiento"),
    ).toBeVisible()
    await saveFollowUp(page)
    await expectSaved(page)

    expect(capture.patientPatches.length).toBeGreaterThan(0)
    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.interlocutorId).toBe(HISTORICAL_PATIENT_ID)
  })

  test("guarda un diagnóstico", async ({ page }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await addDiagnosisDraft(page)
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.diagnoses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          diagnosis: "CANCER_MAMA",
          mode: "PARALLEL",
        }),
      ]),
    )
  })

  test("guarda diagnóstico y tratamiento vinculados", async ({ page }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await addDiagnosisDraft(page)
    await addTreatmentDraft(page)
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    const diagnoses = body.diagnoses as Array<Record<string, unknown>>
    const treatments = body.treatments as Array<Record<string, unknown>>
    expect(diagnoses[0]).toMatchObject({
      diagnosis: "CANCER_MAMA",
      mode: "PARALLEL",
    })
    expect(treatments[0].treatmentType).toBe("QUIMIOTERAPIA")
    expect(
      treatments[0].diagnosisRef ?? treatments[0].diagnosisId,
    ).toBeTruthy()
  })

  test("guarda antecedentes", async ({ page }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await openTab(page, "Antecedentes")
    await chooseLabeled(
      page,
      followUpDialog(page),
      "¿Tiene antecedentes de psiquiatría?",
      "Sí",
    )
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar antecedentes" })
      .click()
    await expect(
      page.getByText("Antecedentes guardados en el borrador"),
    ).toBeVisible()
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.healthBackgroundAssessment).toMatchObject({
      hasPsychiatry: true,
    })
  })

  test("guarda seguro SIS y afiliación", async ({ page }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await openTab(page, "Seguro")
    await chooseLabeled(page, followUpDialog(page), "Tipo de seguro", "SIS")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar seguro" })
      .click()
    await expect(page.getByText("Seguro guardado en el borrador")).toBeVisible()
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.insurance).toMatchObject({ insuranceType: "SIS" })
    expect(body.sisAffiliation).toMatchObject({ canAffiliate: true })
  })

  test("guarda una nota de seguimiento social", async ({ page }) => {
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await openTab(page, "Seguimiento social")
    await followUpDialog(page)
      .getByPlaceholder("Ej: Inició el trámite; falta presentar...")
      .fill("Trámite CONADIS en curso")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar seguimiento social" })
      .click()
    await expect(
      page.getByText("Seguimiento social guardado en el borrador"),
    ).toBeVisible()
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.socialNotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "CONADIS",
          note: "Trámite CONADIS en curso",
        }),
      ]),
    )
  })

  test("guarda seguimiento no oncológico cuando el cáncer está descartado", async ({
    page,
  }) => {
    const capture = await mockHistoricalApi(page, {
      diagnosticStatus: {
        id: "status-ruled-out",
        patientId: HISTORICAL_PATIENT_ID,
        followUpId: null,
        status: "RULED_OUT",
        occurredAt: "2024-05-01T00:00:00.000Z",
        reportedDiagnosis: null,
        diagnosisId: null,
        supportedBySepa: null,
        notes: null,
        createdAt: "2024-05-01T00:00:00.000Z",
        searchStartedAt: null,
        searchDurationMinutes: null,
      },
    })
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await openTab(page, "Síntomas")
    await followUpDialog(page)
      .getByPlaceholder("Ej. gastritis, anemia, hipertensión")
      .fill("Hipertensión arterial")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar seguimiento no oncológico" })
      .click()
    await expect(
      page.getByText("Seguimiento no oncológico guardado en el borrador"),
    ).toBeVisible()
    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.nonOncologicalFollowUp).toMatchObject({
      diagnosis: "Hipertensión arterial",
    })
  })

  test("guarda todos los bloques clínicos juntos", async ({ page }) => {
    test.setTimeout(90_000)
    const capture = await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)

    await openTab(page, "Datos clínicos")
    await followUpDialog(page)
      .getByRole("checkbox", { name: "Requiere traducción" })
      .click()
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar datos generales" })
      .click()

    await openTab(page, "Síntomas")
    await chooseLabeled(
      page,
      followUpDialog(page),
      "¿Presenta malestar o dolor?",
      "Sí",
    )
    await followUpDialog(page)
      .getByPlaceholder("Describe los signos o síntomas...")
      .fill("Dolor persistente")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar síntomas" })
      .click()

    await openTab(page, "Direcciones")
    await followUpDialog(page)
      .getByPlaceholder("Av. Principal 123")
      .fill("Jr. Cusco 100")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar dirección" })
      .click()

    await openTab(page, "Contacto")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar contacto" })
      .click()

    await addDiagnosisDraft(page)
    await addTreatmentDraft(page)

    await openTab(page, "Antecedentes")
    await chooseLabeled(
      page,
      followUpDialog(page),
      "¿Tiene antecedentes de psiquiatría?",
      "Sí",
    )
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar antecedentes" })
      .click()

    await openTab(page, "Seguro")
    await chooseLabeled(page, followUpDialog(page), "Tipo de seguro", "SIS")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar seguro" })
      .click()

    await openTab(page, "Seguimiento social")
    await followUpDialog(page)
      .getByPlaceholder("Ej: Inició el trámite; falta presentar...")
      .fill("Trámite CONADIS en curso")
    await followUpDialog(page)
      .getByRole("button", { name: "Guardar seguimiento social" })
      .click()

    await saveFollowUp(page)
    await expectSaved(page)

    const body = lastFollowUp(capture)
    expectBasePayload(body)
    expect(body.details).toMatchObject({ requiresTranslation: true })
    expect(body.symptomReport).toMatchObject({ hasDiscomfort: true })
    expect(body.addresses).toEqual(
      expect.arrayContaining([expect.objectContaining({ address: "Jr. Cusco 100" })]),
    )
    expect(body.diagnoses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ diagnosis: "CANCER_MAMA" }),
      ]),
    )
    expect(body.treatments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ treatmentType: "QUIMIOTERAPIA" }),
      ]),
    )
    expect(body.healthBackgroundAssessment).toMatchObject({
      hasPsychiatry: true,
    })
    expect(body.insurance).toMatchObject({ insuranceType: "SIS" })
    expect(body.socialNotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "CONADIS" }),
      ]),
    )
  })

  test("pide el agente en español si falta", async ({ page }) => {
    await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillScheduledOn(page)
    await saveFollowUp(page)
    await expect(
      page.getByText("Selecciona el agente responsable").first(),
    ).toBeVisible()
    await expect(
      page.getByText("No se pudo guardar el seguimiento histórico"),
    ).toBeVisible()
    await expect(page.getByText(ENGLISH_ERROR)).toHaveCount(0)
  })

  test("pide una fecha en español si faltan ambas", async ({ page }) => {
    await mockHistoricalApi(page)
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await chooseLabeled(
      page,
      followUpDialog(page),
      /Agente responsable/,
      HISTORICAL_AGENT_NAME,
    )
    await saveFollowUp(page)
    await expect(
      page
        .getByText("Indica la fecha programada o la fecha de realización")
        .first(),
    ).toBeVisible()
    await expect(
      page.getByText("No se pudo guardar el seguimiento histórico"),
    ).toBeVisible()
    await expect(page.getByText(ENGLISH_ERROR)).toHaveCount(0)
  })

  test("traduce un catálogo desconocido del backend al español", async ({
    page,
  }) => {
    await mockHistoricalApi(page, {
      followUpError: {
        status: 400,
        message: "Unknown cancer_diagnosis catalog value: FakeDx",
      },
    })
    await openHistoricalPatient(page)
    await openFollowUpDialog(page)
    await fillMetadata(page)
    await saveFollowUp(page)
    await expect(page.getByText("Unknown cancer_diagnosis")).toHaveCount(0)
    await expect(
      page.getByText("No se pudo guardar el seguimiento histórico"),
    ).toBeVisible()
    await expect(
      page.getByText(/«FakeDx» no está en el catálogo de Diagnóstico oncológico/).first(),
    ).toBeVisible()
    await expect(page.getByText(/Verificá esa selección/).first()).toBeVisible()
  })
})
