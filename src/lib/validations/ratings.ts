import { z } from "zod";

const bookIdSchema = z.string().uuid("Livro inválido");

export const bookRatingAccessRequestSchema = z.object({
  bookId: bookIdSchema,
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido")
    .max(254, "E-mail deve ter no máximo 254 caracteres"),
});

export const bookRatingFormSchema = z.object({
  bookId: bookIdSchema,
  rating: z.coerce
    .number({ invalid_type_error: "Selecione uma nota" })
    .int("A nota deve ser um número inteiro")
    .min(1, "A nota mínima é 1 estrela")
    .max(5, "A nota máxima é 5 estrelas"),
  comment: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(500, "O comentário deve ter no máximo 500 caracteres").optional()
  ),
});

export type BookRatingFormInput = z.infer<typeof bookRatingFormSchema>;
export type BookRatingAccessRequestInput = z.infer<typeof bookRatingAccessRequestSchema>;
