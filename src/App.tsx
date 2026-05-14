import { RouterProvider } from "react-router-dom";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import { router } from "@/router";

export default function App() {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </QueryProvider>
  );
}
