import { z } from "zod";

export const ObligationSchema = z.object({
  obligation_summary: z.string(),
  action_required: z.string(),
  intermediary_category: z.enum([
    "stockbroker",
    "investment_adviser",
    "rta",
    "amc",
    "unspecified",
  ]),
  frequency: z.string().nullable(),
  deadline_rule: z.string().nullable(),
  evidence_type: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export const ExtractionResultSchema = z.object({
  obligations: z.array(ObligationSchema),
});

export type Obligation = z.infer<typeof ObligationSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
