import { z } from "zod";

export const JDTypeSchema = z.enum(["area", "category", "id"], {
  error: (iss) => (iss.input === undefined ? "missing required field 'type'" : `invalid type '${iss.input}'`),
});

export const JDEntrySchema = z
  .object({
    type: JDTypeSchema,
    name: z
      .string({ error: (iss) => (iss.input === undefined ? "missing required field 'name'" : undefined) })
      .min(1, "field 'name' must not be empty"),
    parent: z
      .string({ error: (iss) => (iss.input === undefined ? "missing required field 'parent'" : undefined) })
      .nullable(),
    description: z.string().optional(),
  })
  .strict();

export const JDIndexFileSchema = z.object({
  created: z.iso.datetime({ error: "invalid 'created' timestamp" }),
  updated: z.iso.datetime({ error: "invalid 'updated' timestamp" }),
  entries: z.record(z.string(), JDEntrySchema),
});

export type JDType = z.infer<typeof JDTypeSchema>;
export type JDEntry = z.infer<typeof JDEntrySchema>;
export type JDIndex = Record<string, JDEntry>;
export type JDIndexFile = z.infer<typeof JDIndexFileSchema>;
