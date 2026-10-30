import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Link } from "react-router-dom"
import type { AssistantMessage } from "@/api/assistant"

export function AssistantMarkdown({ message }: { message: AssistantMessage }) {
  const patients = new Map(
    message.patients.map((patient) => [
      `/pacientes/${patient.patientId}`,
      patient,
    ]),
  )
  return (
    <div className="assistant-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        disallowedElements={["img"]}
        components={{
          // Solo los enlaces de fichas que la API identifica son navegables.
          a: ({ href, children }) => {
            const citation = message.citations?.find(
              (source) => href === `#source-${source.number}`,
            )
            if (citation)
              return (
                <button
                  type="button"
                  className="font-medium text-sky-700 underline underline-offset-2"
                  onClick={() => {
                    const source = document.getElementById(
                      `source-${message.id}-${citation.number}`,
                    )
                    source?.setAttribute("open", "")
                    source?.scrollIntoView({ block: "nearest" })
                    source?.querySelector("summary")?.focus()
                  }}
                >
                  {children}
                </button>
              )
            return href && patients.has(href) ? (
              <Link to={href}>{children}</Link>
            ) : (
              <span>{children}</span>
            )
          },
          table: ({ children }) => (
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Tabla de resultados"
              tabIndex={0}
            >
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  )
}
