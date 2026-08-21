import { z } from "zod";
import { CONTACT_TOPIC_IDS, type ContactTopicId } from "./topics";

const HEADER_UNSAFE = /[\r\n\u0000-\u001F\u007F]/;

export function containsHeaderInjection(value: string): boolean {
  return HEADER_UNSAFE.test(value);
}

export function stripControlChars(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function requiredText(max: number) {
  return z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !containsHeaderInjection(value), { message: "invalid" });
}

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .email()
  .refine((value) => !containsHeaderInjection(value), { message: "invalid" });

export const contactEnquirySchema = z.object({
  name: requiredText(100),
  email: emailField,
  topic: z.enum(CONTACT_TOPIC_IDS),
  subject: requiredText(160),
  message: z
    .string()
    .trim()
    .min(10)
    .max(4000)
    .transform((value) => stripControlChars(value).replace(/\r\n|\r/g, "\n")),
  accountEmail: z.string().max(254).optional(),
  website: z.string().max(200).optional(),
});

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;

export type ContactEnquiryPayload = {
  reference: string;
  topicId: ContactTopicId;
  topicLabel: string;
  name: string;
  email: string;
  accountEmail?: string;
  subject: string;
  message: string;
  receivedAt: string;
  environment: string;
  destination: string;
};

export function createContactReference(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `ZCT-${token}`;
}

export function contactEnvironment(): string {
  const vercel = (process.env.VERCEL_ENV || "").trim();
  if (vercel) return vercel;
  return process.env.NODE_ENV || "development";
}

export const CONTACT_GENERIC_ERROR = "Unable to send this enquiry.";
export const CONTACT_VALIDATION_ERROR = "Check the form and try again.";
export const CONTACT_RATE_LIMIT_ERROR = "Please try again later.";
