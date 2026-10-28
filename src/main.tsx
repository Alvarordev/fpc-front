import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/geist-sans/index.css";
import "@fontsource/geist-mono/index.css";
import App from "@/App";
import "@/globals.css";
import { z } from "zod";
import { installSpanishFormValidity } from "@/lib/spanish-form-validity";

// Mensajes por defecto de zod en español para reglas sin texto propio.
z.config(z.locales.es());
installSpanishFormValidity();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
