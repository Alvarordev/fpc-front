import {
  Activity,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Clock,
  Globe,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  Hospital,
  House,
  IdCard,
  MapPin,
  MessageSquareText,
  MessagesSquare,
  Microscope,
  Phone,
  ShieldCheck,
  ShieldPlus,
  Signpost,
  Star,
  Stethoscope,
  Syringe,
  UserCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { Group } from "@/components/ds/questions"
import type { Tone } from "@/components/ds/tone"

// Ícono y tono de cada sección del enrolamiento, para seguir el rastro al bajar
// por el formulario. Los temas afines comparten tono (dirección y procedencia,
// teal; salud, rose). Sin rojo ni ámbar: esos tonos son de alerta.

const SECTIONS: Record<string, { icon: LucideIcon; tone: Tone }> = {
  "Qué decirle": { icon: MessagesSquare, tone: "blue" },
  "Registro de tiempo": { icon: Clock, tone: "gray" },
  "Fecha del hecho": { icon: CalendarDays, tone: "gray" },
  "Autorización de datos": { icon: ShieldCheck, tone: "green" },
  "Tipo de afiliación": { icon: UserCheck, tone: "blue" },
  "Relación con el paciente": { icon: HeartHandshake, tone: "violet" },
  "Respuesta del paciente": { icon: MessageSquareText, tone: "blue" },
  Identidad: { icon: IdCard, tone: "blue" },
  "Contacto del paciente": { icon: Phone, tone: "green" },
  Acompañantes: { icon: Users, tone: "violet" },
  Procedencia: { icon: Globe, tone: "teal" },
  "Dirección actual": { icon: MapPin, tone: "teal" },
  "Vivienda provisional": { icon: House, tone: "teal" },
  "Perfil socioeducativo": { icon: GraduationCap, tone: "indigo" },
  "Seguro de salud": { icon: ShieldPlus, tone: "rose" },
  "Punto de ingreso": { icon: Signpost, tone: "gray" },
  "Perfil clínico": { icon: Stethoscope, tone: "rose" },
  "Establecimiento principal del paciente": { icon: Hospital, tone: "teal" },
  "Signos y síntomas": { icon: Activity, tone: "rose" },
  "Consultas médicas": { icon: CalendarClock, tone: "blue" },
  "Diagnóstico oncológico": { icon: Microscope, tone: "violet" },
  "Tratamiento actual": { icon: Syringe, tone: "indigo" },
  Tratamientos: { icon: Syringe, tone: "indigo" },
  "Afiliación SIS": { icon: BadgeCheck, tone: "green" },
  "Servicios de apoyo": { icon: HandHeart, tone: "violet" },
  "Encuesta de satisfacción": { icon: Star, tone: "indigo" },
  Responsable: { icon: UserRound, tone: "gray" },
  Resumen: { icon: ClipboardList, tone: "gray" },
  "Registro exitoso": { icon: CircleCheck, tone: "green" },
}

export function sectionIcon(title: string) {
  return SECTIONS[title]
}

/** Agrega el ícono de su sección a cada grupo que se dibuja como tarjeta. */
export function withIcons(groups: Group[]): Group[] {
  return groups.map((g) => ({ ...SECTIONS[g.title], ...g }))
}
