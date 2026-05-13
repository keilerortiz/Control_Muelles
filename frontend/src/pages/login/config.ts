import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const platformHighlights = [
  "Control operativo en tiempo real",
  "Trazabilidad por usuario y estado",
  "Gestión segura de accesos",
];
