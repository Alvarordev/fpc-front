import { expect, test } from "@playwright/test"
import { mockApi, openAuthenticated } from "./helpers"

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test("enrolamiento paso 5 usa el catálogo de ingreso y excluye frases viejas", async ({
  page,
}) => {
  await openAuthenticated(page, "/enrolamiento", { currentStep: 5 })

  await expect(
    page.getByRole("heading", { name: "Paso 5: Datos del Paciente" }),
  ).toBeVisible()
  await expect(page.getByText("Llamada directa")).toHaveCount(0)

  const ingreso = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Punto de Ingreso" }),
  })
  await ingreso.getByRole("combobox").first().click()
  await expect(
    page.getByRole("option", { name: "Línea telefónica" }),
  ).toBeVisible()
  await expect(
    page.getByRole("option", { name: "Redes sociales" }),
  ).toBeVisible()
  await expect(
    page.getByRole("option", { name: "Llamada directa" }),
  ).toHaveCount(0)

  await page.getByRole("option", { name: "Línea telefónica" }).click()
  await ingreso.getByRole("combobox").nth(1).click()
  await expect(
    page.getByRole("option", { name: "Llamada entrante" }),
  ).toBeVisible()
})

test("paso 6 muestra fases del catálogo y oculta Control anual", async ({
  page,
}) => {
  await openAuthenticated(page, "/enrolamiento", { currentStep: 6 })

  await expect(
    page.getByRole("heading", { name: "Paso 6: Categorización del Paciente" }),
  ).toBeVisible()
  await page.getByRole("combobox").first().click()
  await expect(
    page.getByRole("option", { name: "Diagnóstico de cáncer" }),
  ).toBeVisible()
  await expect(
    page.getByRole("option", { name: "Signos y síntomas" }),
  ).toBeVisible()
  await expect(page.getByRole("option", { name: "Control anual" })).toHaveCount(
    0,
  )
})

test("una fuente vieja avisa en español y el enrolamiento histórico no muestra el error en inglés", async ({
  page,
}) => {
  await openAuthenticated(page, "/carga-historica/nuevo", {
    currentStep: 8,
    enrollmentMode: "HISTORICAL",
    programEntryPoint: "Call center",
  })

  await expect(page.getByTestId("catalog-unknown-value")).toBeVisible()
  await expect(page.getByTestId("catalog-unknown-value")).toContainText(
    "Punto de ingreso",
  )
  await expect(page.getByTestId("catalog-unknown-value")).toContainText(
    "Call center",
  )
  await expect(page.getByTestId("catalog-unknown-value")).toContainText(
    "no está en el catálogo",
  )
  await expect(page.getByTestId("catalog-unknown-value")).toContainText(
    "Verificá esa selección",
  )

  await page.getByRole("button", { name: "Finalizar inscripción" }).click()
  await expect(page.getByText("Unknown entry_source")).toHaveCount(0)
  await expect(page.getByText("Error al enrolar")).toBeVisible()
  await expect(
    page.getByText(/«Call center» no está en el catálogo de Punto de ingreso/),
  ).toHaveCount(3)
})
