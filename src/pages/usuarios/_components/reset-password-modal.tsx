import { useState } from "react"
import { KeyRound } from "lucide-react"
import { toast } from "sonner"
import type { User } from "@/api/users"
import { Button } from "@/components/ds/button"
import { Field, TextInput } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import { useUpdateUser } from "../_hooks/use-users"

export function ResetPasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const updateUser = useUpdateUser()
  const [password, setPassword] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  if (user && user.id !== userId) {
    setUserId(user.id)
    setPassword("")
  }
  if (!user) return null
  const pending = updateUser.isPending

  async function submit() {
    if (!user) return
    if (password.trim().length < 8) return toast.error("La contraseña debe tener al menos 8 caracteres")
    try {
      await updateUser.mutateAsync({ id: user.id, input: { password: password.trim() } })
      toast.success("Contraseña restablecida", { description: user.email })
      onClose()
    } catch (error) {
      toast.error("No se pudo restablecer la contraseña", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  return (
    <Modal
      open
      onClose={() => !pending && onClose()}
      icon={KeyRound}
      title="Restablecer contraseña"
      description={user.email}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="dark" disabled={pending || password.trim().length < 8} onClick={() => void submit()}>
            {pending ? "Guardando…" : "Restablecer"}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-zinc-700">La contraseña actual deja de servir. La persona entra con la nueva.</p>
      <Field label="Nueva contraseña" hint="Mínimo 8 caracteres">
        {(id) => (
          <TextInput
            id={id}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        )}
      </Field>
    </Modal>
  )
}
