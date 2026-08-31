import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { genderLabels, relationshipSelectOptions } from "@/pages/pacientes/[id]/_lib/clinical-labels"
import { UserCheck } from "lucide-react"
import { useEnrollmentStore } from "../../_store/enrollment-store"
import { SectionHeader, StepHeader, StepNav } from "../shared"

const fl = "text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70"
const ic = "bg-card border"
const sc = "w-full bg-card border"

const YES_NO_PATIENT_OPTIONS = [
  { value: "Sí", label: "Sí, soy paciente oncológico" },
  { value: "No", label: "No" },
] as const

const YES_NO_FAMILY_OPTIONS = [
  { value: "Sí", label: "Sí, soy familiar" },
  { value: "No", label: "No, soy amigo u otra persona" },
] as const

const YES_NO_OPTIONS = [
  { value: "Sí", label: "Sí" },
  { value: "No", label: "No" },
] as const

export function Step3Identificacion() {
  const { draft, updateDraft, nextStep, prevStep } = useEnrollmentStore()
  const [error, setError] = useState<string | null>(null)
  const meta = draft.enrollmentMetadata
  const companion = draft.companion
  const isParaMi = meta.affiliationType === "PATIENT"
  const isParaTercero = meta.affiliationType === "FAMILY"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      isParaTercero &&
      (!companion.fullName.trim() ||
        !companion.primaryPhone.trim() ||
        !companion.relationship?.trim())
    ) {
      setError("Ingrese el nombre, teléfono y parentesco de quien llama")
      return
    }
    setError(null)
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <StepHeader
        step={3}
        title="Identificación de quien llama"
        description="Registre a la persona que realiza esta llamada de enrolamiento."
      />
      <div className="flex flex-col gap-6">
        <SectionHeader icon={UserCheck} title="Relación con el paciente" />
        {isParaMi && (
          <div className="flex flex-col gap-2">
            <Label className={fl}>¿Usted es paciente oncológico?</Label>
            <Select
              items={YES_NO_PATIENT_OPTIONS}
              value={
                meta.isOncologicalPatient === true
                  ? "Sí"
                  : meta.isOncologicalPatient === false
                    ? "No"
                    : ""
              }
              onValueChange={(value) =>
                updateDraft({
                  enrollmentMetadata: {
                    ...meta,
                    isOncologicalPatient: value === "Sí",
                  },
                })
              }
            >
              <SelectTrigger className={sc}>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {YES_NO_PATIENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {isParaTercero && (
          <>
            <div className="flex flex-col gap-2">
              <Label className={fl}>
                ¿Usted es familiar del paciente oncológico?
              </Label>
              <Select
                items={YES_NO_FAMILY_OPTIONS}
                value={
                  meta.isOncologicalPatient === true
                    ? "Sí"
                    : meta.isOncologicalPatient === false
                      ? "No"
                      : ""
                }
                onValueChange={(value) =>
                  updateDraft({
                    enrollmentMetadata: {
                      ...meta,
                      isOncologicalPatient: value === "Sí",
                    },
                  })
                }
              >
                <SelectTrigger className={sc}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {YES_NO_FAMILY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Nombre completo de quien llama <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={companion.fullName}
                  onChange={(event) =>
                    updateDraft({
                      companion: {
                        ...companion,
                        fullName: event.target.value,
                      },
                    })
                  }
                  placeholder="Nombre y apellidos"
                  className={ic}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Parentesco con el paciente <span className="text-destructive">*</span>
                </Label>
                {(() => {
                  const known = relationshipSelectOptions.some(
                    (option) => option.value === companion.relationship,
                  )
                  const selectValue = !companion.relationship
                    ? ""
                    : known
                      ? companion.relationship
                      : "OTHER"
                  const otherText =
                    selectValue === "OTHER" && companion.relationship !== "OTHER"
                      ? (companion.relationship ?? "")
                      : ""
                  return (
                    <>
                      <Select
                        items={[...relationshipSelectOptions]}
                        value={selectValue}
                        onValueChange={(value) =>
                          updateDraft({
                            companion: {
                              ...companion,
                              relationship:
                                value === "OTHER"
                                  ? otherText || "OTHER"
                                  : (value ?? undefined),
                            },
                          })
                        }
                      >
                        <SelectTrigger className={sc}>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipSelectOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectValue === "OTHER" && (
                        <Input
                          value={otherText}
                          onChange={(event) =>
                            updateDraft({
                              companion: {
                                ...companion,
                                relationship:
                                  event.target.value.trim() || "OTHER",
                              },
                            })
                          }
                          placeholder="Especifique el parentesco"
                          className={ic}
                        />
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className={fl}>DNI</Label>
                <Input
                  value={companion.dni ?? ""}
                  onChange={(event) =>
                    updateDraft({
                      companion: {
                        ...companion,
                        dni: event.target.value || undefined,
                      },
                    })
                  }
                  placeholder="74829304"
                  className={ic}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>Fecha de nacimiento</Label>
                <Input
                  type="date"
                  value={companion.birthDate ?? ""}
                  onChange={(event) =>
                    updateDraft({
                      companion: {
                        ...companion,
                        birthDate: event.target.value || undefined,
                      },
                    })
                  }
                  className={ic}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className={fl}>Género de quien llama</Label>
              <Select
                items={Object.entries(genderLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                value={companion.gender ?? ""}
                onValueChange={(value) =>
                  updateDraft({
                    companion: { ...companion, gender: value || undefined },
                  })
                }
              >
                <SelectTrigger className={sc}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(genderLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className={fl}>
                  Teléfono principal <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={companion.primaryPhone}
                  onChange={(event) =>
                    updateDraft({
                      companion: {
                        ...companion,
                        primaryPhone: event.target.value,
                      },
                    })
                  }
                  placeholder="999 000 777"
                  className={ic}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className={fl}>Teléfono adicional o fijo</Label>
                <Input
                  value={companion.secondaryPhone ?? ""}
                  onChange={(event) =>
                    updateDraft({
                      companion: {
                        ...companion,
                        secondaryPhone: event.target.value || undefined,
                      },
                    })
                  }
                  placeholder="01 555 1234"
                  className={ic}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className={fl}>¿Tiene WhatsApp?</Label>
              <Select
                items={YES_NO_OPTIONS}
                value={companion.hasWhatsapp ? "Sí" : "No"}
                onValueChange={(value) =>
                  updateDraft({
                    companion: { ...companion, hasWhatsapp: value === "Sí" },
                  })
                }
              >
                <SelectTrigger className={sc}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YES_NO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        {!isParaMi && !isParaTercero && (
          <div className="rounded-xl bg-card p-4 text-sm text-muted-foreground">
            Tipo de afiliación no definido. Regrese al paso anterior.
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <StepNav currentStep={3} onPrev={prevStep} />
    </form>
  )
}
