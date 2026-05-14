import { useEnrollmentStore } from "../../_store/enrollment-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function Step1Inicio() {
  const { draft, updateDraft } = useEnrollmentStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicio del enrolamiento</CardTitle>
        <CardDescription>
          Registrá los comentarios iniciales del caso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Comentarios del caso</Label>
          <Textarea
            value={draft.enrollmentMetadata.caseComments ?? ""}
            onChange={(e) =>
              updateDraft({
                enrollmentMetadata: {
                  ...draft.enrollmentMetadata,
                  caseComments: e.target.value,
                },
              })
            }
            placeholder="Observaciones relevantes sobre el paciente y el contexto del enrolamiento..."
            className="min-h-32 resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
