import { z } from "zod";

export const SettingsSchema = z.object({
  sentenceLength: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number({ invalid_type_error: "Sentence length is required" })
      .min(10, "Min 10 words")
      .max(40, "Max 40 words")
  ),
  timeLimit: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number({ invalid_type_error: "Time limit is required" })
      .min(30, "Min 30 sec")
      .max(120, "Max 120 sec")
  ),
  maxPlayers: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number({ invalid_type_error: "Player count is required" })
      .min(2, "Min 2")
      .max(6, "Max 6")
  ),
  theme: z.string().min(1, "Please select a theme"),
});
