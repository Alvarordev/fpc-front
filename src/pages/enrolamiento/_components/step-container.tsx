import type { FormEventHandler, ReactNode } from "react"

interface StepContainerProps {
  embedded?: boolean
  className?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  children: ReactNode
}

export function StepContainer({
  embedded = false,
  className,
  onSubmit,
  children,
}: StepContainerProps) {
  if (embedded) return <div className={className}>{children}</div>
  return (
    <form className={className} onSubmit={onSubmit}>
      {children}
    </form>
  )
}
