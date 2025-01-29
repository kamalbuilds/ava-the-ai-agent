import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_PORT: z.coerce.number().default(3000),
  NEXT_PUBLIC_BRIAN_API_URL: z.string().default("https://staging-api.brianknows.org"),
  NEXT_PUBLIC_CHAIN_ID: z.string().default("8453"),
  NEXT_PUBLIC_CHAIN_NAME: z.string().default("base"),
  NEXT_PUBLIC_MODEL_NAME: z.string().default("gpt-4o-2024-08-06"),
});

export const env = envSchema.parse(process.env);

export type Environment = {
  Bindings: z.infer<typeof envSchema>;
};

export default env;
