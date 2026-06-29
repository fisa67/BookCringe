import { z } from "zod";

export const formTypes = ["contato", "trabalhe-comigo", "clube-de-leitura"] as const;
export type FormType = (typeof formTypes)[number];

export const formTypeLabels: Record<FormType, string> = {
  contato: "Contato",
  "trabalhe-comigo": "Trabalhe Comigo",
  "clube-de-leitura": "Clube de Leitura",
};

export const contactSubjects = [
  "parceria",
  "resenha",
  "clube",
  "sugestao",
  "outro",
] as const;

export type ContactSubject = (typeof contactSubjects)[number];

export const contactSubjectLabels: Record<ContactSubject, string> = {
  parceria: "Parceria comercial",
  resenha: "Envio de livro para resenha",
  clube: "Clube de Leitura",
  sugestao: "Sugestão de livro",
  outro: "Outro assunto",
};

export const partnershipTypes = ["editora", "autor", "marca", "outro"] as const;
export type PartnershipType = (typeof partnershipTypes)[number];

export const partnershipTypeLabels: Record<PartnershipType, string> = {
  editora: "Editora",
  autor: "Autor",
  marca: "Marca",
  outro: "Outro",
};

const baseFormFields = {
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido")
    .max(254, "E-mail deve ter no máximo 254 caracteres"),
  message: z
    .string()
    .trim()
    .min(1, "Mensagem é obrigatória")
    .max(5000, "Mensagem deve ter no máximo 5000 caracteres"),
};

export const contatoFormSchema = z.object({
  formType: z.literal("contato"),
  ...baseFormFields,
  subject: z.enum(contactSubjects, {
    errorMap: () => ({ message: "Selecione um assunto válido" }),
  }),
});

export const trabalheComigoFormSchema = z.object({
  formType: z.literal("trabalhe-comigo"),
  ...baseFormFields,
  company: z
    .string()
    .trim()
    .max(150, "Empresa deve ter no máximo 150 caracteres")
    .transform((value) => value || undefined)
    .optional(),
  type: z.enum(partnershipTypes, {
    errorMap: () => ({ message: "Selecione um tipo de parceria válido" }),
  }),
});

export const clubeFormSchema = z.object({
  formType: z.literal("clube-de-leitura"),
  ...baseFormFields,
});

export const formSubmissionSchema = z.discriminatedUnion("formType", [
  contatoFormSchema,
  trabalheComigoFormSchema,
  clubeFormSchema,
]);

export type FormSubmission = z.infer<typeof formSubmissionSchema>;
export type ContatoFormInput = z.infer<typeof contatoFormSchema>;
export type TrabalheComigoFormInput = z.infer<typeof trabalheComigoFormSchema>;
export type ClubeFormInput = z.infer<typeof clubeFormSchema>;

export function formatValidationErrors(
  error: z.ZodError
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && field !== "formType" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}
