import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  GROQ_API_KEY: z.string(),
  NETWORK_ID: z.string(),
  SUPABASE_URL: z.string(),
  SUPABASE_KEY: z.string(),
  PRIVATE_KEY: z.string(),
  WALLET_ADDRESS: z.string(),
  WALLET_PRIVATE_KEY: z.string(),
  ZERION_API_KEY: z.string(),
  BRIAN_API_KEY: z.string(),
  PORTALS_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  BRIAN_API_URL: z.string().default("https://api.brianknows.org"),
  CHAIN_ID: z.string().default("8453"),
  CHAIN_NAME: z.string().default("base"),
  MODEL_NAME: z.string().default("gpt-3.5-turbo"),
  CDP_API_KEY_NAME: z.string(),
  CDP_API_KEY_PRIVATE_KEY: z.string(),
  MNEMONIC_PHRASE: z.string(),
  GOLDRUSH_API: z.string(),
  PERPLEXITY_API_KEY: z.string(),
  ENABLE_PRIVATE_COMPUTE: z.boolean().default(false),
  DEFAULT_AI_PROVIDER: z.enum(['openai', 'atoma']).default('openai'),
  COOKIE_API_KEY: z.string(),
  ATOMA_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Environment = {
  Bindings: z.infer<typeof envSchema>;
};

export default env;
