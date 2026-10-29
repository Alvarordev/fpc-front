import { Card } from "@/components/ds/card"

/**
 * Bloque de un paso largo. En el wizard es una tarjeta blanca. En la carga
 * histórica el paso ya vive en una tarjeta, así que aquí queda texto plano.
 */
export function SectionBlock({
  embedded = false,
  title,
  description,
  children,
}: {
  embedded?: boolean
  title: string
  description?: string
  children: React.ReactNode
}) {
  if (embedded) {
    return (
      <section className="border-t border-zinc-100 pt-5 first:border-0 first:pt-0">
        <h4 className="text-sm font-semibold text-zinc-900">{title}</h4>
        {description && <p className="mt-0.5 mb-4 text-[13px] text-zinc-500">{description}</p>}
        {!description && <div className="mb-4" />}
        {children}
      </section>
    )
  }
  return (
    <Card title={title} description={description}>
      {children}
    </Card>
  )
}
