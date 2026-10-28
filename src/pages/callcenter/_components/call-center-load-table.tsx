import type { CallCenterWorkload } from "@/api/call-center"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function Count({ value }: { value: number }) {
  return <td className="px-3 py-3 text-right tabular-nums">{value}</td>
}

export function CallCenterLoadTable({
  load,
}: {
  load: CallCenterWorkload["load"]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Carga por agente</CardTitle>
        <CardDescription>
          Hoy, lo que vence hasta el domingo y lo que ya está vencido.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0 pb-2">
        {load.length === 0 ? (
          <p className="text-muted-foreground px-5 py-4 text-sm">
            No hay agentes en la carga.
          </p>
        ) : (
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs">
                <th className="px-5 py-2 font-medium" rowSpan={2}>
                  Agente
                </th>
                <th className="px-3 py-2 text-center font-medium" colSpan={3}>
                  Seguimientos
                </th>
                <th className="px-3 py-2 text-center font-medium" colSpan={3}>
                  Recordatorios
                </th>
              </tr>
              <tr className="text-muted-foreground border-b text-right text-xs">
                <th className="px-3 py-2 font-medium">Hoy</th>
                <th className="px-3 py-2 font-medium">Semana</th>
                <th className="px-3 py-2 font-medium">Vencidos</th>
                <th className="px-3 py-2 font-medium">Hoy</th>
                <th className="px-3 py-2 font-medium">Semana</th>
                <th className="px-3 py-2 font-medium">Vencidos</th>
              </tr>
            </thead>
            <tbody>
              {load.map((row) => (
                <tr key={row.agentId} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">{row.fullName}</td>
                  <Count value={row.followUps.today} />
                  <Count value={row.followUps.week} />
                  <Count value={row.followUps.overdue} />
                  <Count value={row.reminders.today} />
                  <Count value={row.reminders.week} />
                  <Count value={row.reminders.overdue} />
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
