import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(1, "El nombre de usuario es obligatorio")
  .max(50, "El nombre de usuario no puede superar 50 caracteres")
  .regex(
    /^[\p{L}\p{N}._-]+$/u,
    "Usa solo letras, números, puntos, guiones y guiones bajos",
  );

export const emailSchema = z
  .string()
  .trim()
  .min(1, "El correo electrónico es obligatorio")
  .email("El correo electrónico no es válido")
  .max(254, "El correo electrónico es demasiado largo")
  .transform((email) => email.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no puede superar 72 caracteres");

export const registrationSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type LoginInput = z.input<typeof loginSchema>;
