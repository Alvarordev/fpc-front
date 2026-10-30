import { RouterProvider } from "react-router-dom"
import { useEffect } from "react"
import { QueryProvider } from "@/providers/query-provider"
import { AppCatalogProvider } from "@/components/app-catalog-source"
import { Toaster } from "sonner"
import { router } from "@/router"
import { useAuthStore } from "@/store/auth-store"

export default function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession)

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  return (
    <QueryProvider>
      <AppCatalogProvider>
        <RouterProvider router={router} />
      </AppCatalogProvider>
      <Toaster position="top-right" richColors />
    </QueryProvider>
  )
}
