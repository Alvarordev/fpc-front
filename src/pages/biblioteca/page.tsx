import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BookOpen, Search, Upload } from "lucide-react"
import { toast } from "sonner"
import {
  knowledgeApi,
  openKnowledgeDocument,
  type KnowledgeDocument,
  type KnowledgeStatus,
} from "@/api/knowledge"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ds/button"
import { Card } from "@/components/ds/card"
import { EmptyState } from "@/components/ds/empty-state"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { TextInput } from "@/components/ds/form"
import { InlineAlert } from "@/components/ds/inline-alert"
import { Modal } from "@/components/ds/modal"
import { DocumentRow, type DocumentAction } from "./_components/document-row"
import { UploadDocumentModal } from "./_components/upload-document-modal"

const filters = [
  { id: "ALL", label: "Todos" },
  { id: "PUBLISHED", label: "Publicados" },
  { id: "DRAFT", label: "Borradores" },
  { id: "ARCHIVED", label: "Retirados" },
] as const
type Filter = "ALL" | KnowledgeStatus

export default function LibraryPage() {
  const userId = useAuthStore((state) => state.user?.id)
  const client = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState<Filter>("ALL")
  const [offset, setOffset] = useState(0)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirm, setConfirm] = useState<{
    action: DocumentAction
    document: KnowledgeDocument
  }>()
  const [downloading, setDownloading] = useState<string>()
  const limit = 20
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])
  const documents = useQuery({
    queryKey: [
      "knowledge",
      userId,
      "documents",
      debouncedSearch,
      status,
      offset,
    ],
    queryFn: ({ signal }) =>
      knowledgeApi.list(
        {
          search: debouncedSearch || undefined,
          status: status === "ALL" ? undefined : status,
          limit,
          offset,
        },
        signal,
      ),
    refetchInterval: (query) =>
      query.state.data?.data.some((doc) =>
        ["PENDING", "PROCESSING"].includes(doc.indexStatus),
      )
        ? 5000
        : false,
  })
  function refresh() {
    void client.invalidateQueries({ queryKey: ["knowledge"] })
  }
  const upload = useMutation({
    mutationFn: knowledgeApi.upload,
    retry: false,
    onSuccess: () => {
      setUploadOpen(false)
      setStatus("DRAFT")
      setSearch("")
      setDebouncedSearch("")
      setOffset(0)
      refresh()
      toast.success("Documento subido. Se está preparando para consulta.")
    },
  })
  const action = useMutation({
    mutationFn: async ({
      action,
      document,
    }: {
      action: DocumentAction
      document: KnowledgeDocument
    }) => {
      await knowledgeApi[action](document.id)
    },
    retry: false,
    onSuccess: (_, variables) => {
      if (
        variables.action === "remove" &&
        documents.data?.data.length === 1 &&
        offset > 0
      )
        setOffset(Math.max(0, offset - limit))
      setConfirm(undefined)
      refresh()
      toast.success(
        {
          publish: "Documento publicado",
          archive: "Documento retirado de las consultas",
          remove: "Documento eliminado",
          retry: "Preparación solicitada",
        }[variables.action],
      )
    },
  })
  function onAction(actionName: DocumentAction, doc: KnowledgeDocument) {
    action.reset()
    if (actionName === "retry")
      action.mutate({ action: actionName, document: doc })
    else setConfirm({ action: actionName, document: doc })
  }
  const busy = action.isPending || Boolean(downloading)
  const confirmationTitle =
    confirm?.action === "publish"
      ? "Publicar documento"
      : confirm?.action === "archive"
        ? "Retirar documento"
        : "Eliminar documento"
  return (
    <div className="font-ds space-y-6 text-zinc-900 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-zinc-700">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Biblioteca del programa</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Administra los documentos que respaldan las respuestas del asistente
            durante el enrolamiento y los seguimientos.
          </p>
        </div>
        <Button
          variant="dark"
          icon={Upload}
          onClick={() => {
            upload.reset()
            setUploadOpen(true)
          }}
        >
          Subir documento
        </Button>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <FilterToggles
          value={status}
          options={[...filters]}
          onChange={(value) => {
            setStatus(value)
            setOffset(0)
          }}
        />
        <div className="relative w-full sm:w-72">
          <Search
            aria-hidden
            className="absolute top-2.5 left-3 size-4 text-zinc-500"
          />
          <TextInput
            type="search"
            aria-label="Buscar en la biblioteca"
            value={search}
            placeholder="Buscar por título o archivo…"
            className="pl-9"
            onChange={(event) => {
              setSearch(event.target.value)
              setOffset(0)
            }}
          />
        </div>
      </div>
      <p className="text-[13px] text-zinc-500">
        Solo los documentos publicados se utilizan en las respuestas. Para
        actualizar una versión, sube el nuevo archivo y retira la anterior.
      </p>
      {action.isError && !confirm && (
        <div role="alert">
          <InlineAlert>{action.error.message}</InlineAlert>
        </div>
      )}
      <Card className="min-w-0">
        {documents.isLoading ? (
          <p role="status" className="py-12 text-center text-sm text-zinc-500">
            Cargando biblioteca…
          </p>
        ) : documents.isError ? (
          <div className="space-y-3">
            <InlineAlert>{documents.error.message}</InlineAlert>
            <Button onClick={() => void documents.refetch()}>Reintentar</Button>
          </div>
        ) : documents.data?.data.length ? (
          <>
            <ul className="divide-y divide-zinc-100">
              {documents.data.data.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  busy={busy}
                  onAction={onAction}
                  onDownload={async (document) => {
                    setDownloading(document.id)
                    try {
                      await openKnowledgeDocument(
                        document.id,
                        document.originalName,
                      )
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "No se pudo descargar el documento.",
                      )
                    } finally {
                      setDownloading(undefined)
                    }
                  }}
                />
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
              <p className="text-[13px] text-zinc-500 tabular-nums">
                {offset + 1}–{offset + documents.data.data.length} de{" "}
                {documents.data.total} documentos
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                >
                  Anterior
                </Button>
                <Button
                  disabled={offset + limit >= documents.data.total}
                  onClick={() => setOffset(offset + limit)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title={
              search || status !== "ALL"
                ? "No hay documentos con estos filtros"
                : "Dale una base al asistente"
            }
            body={
              search || status !== "ALL"
                ? "Prueba con otro título o cambia el estado seleccionado."
                : "Sube los manuales y guías aprobados por la fundación. Revisa cada documento y publícalo cuando esté listo."
            }
            action={
              search || status !== "ALL" ? undefined : "Subir primer documento"
            }
            onAction={() => {
              upload.reset()
              setUploadOpen(true)
            }}
          />
        )}
      </Card>
      {uploadOpen && (
        <UploadDocumentModal
          open
          onClose={() => setUploadOpen(false)}
          busy={upload.isPending}
          error={upload.error?.message}
          onUpload={(input) => upload.mutate(input)}
        />
      )}
      <Modal
        open={Boolean(confirm)}
        onClose={() => {
          if (!action.isPending) setConfirm(undefined)
        }}
        icon={BookOpen}
        title={confirmationTitle}
        description={confirm?.document.title}
        footer={
          <>
            <Button
              disabled={action.isPending}
              onClick={() => setConfirm(undefined)}
            >
              Cancelar
            </Button>
            <Button
              variant="dark"
              disabled={action.isPending}
              onClick={() => {
                if (confirm) action.mutate(confirm)
              }}
            >
              {action.isPending ? "Guardando…" : confirmationTitle}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-zinc-700">
          {confirm?.action === "publish"
            ? "Los agentes podrán consultar este documento y el asistente podrá citarlo en sus respuestas. Confirma que su contenido y versión están vigentes."
            : confirm?.action === "archive"
              ? "Este documento dejará de utilizarse en las nuevas consultas. Sus referencias se conservarán en el historial de conversaciones."
              : "Se eliminarán el archivo original y su índice de búsqueda. Las conversaciones conservarán las citas históricas, pero el archivo ya no podrá descargarse. Esta acción no se puede deshacer."}
        </p>
        {action.isError && (
          <div role="alert" className="mt-3">
            <InlineAlert>{action.error.message}</InlineAlert>
          </div>
        )}
      </Modal>
    </div>
  )
}
