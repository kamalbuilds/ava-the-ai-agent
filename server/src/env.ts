import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
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
  MODEL_NAME: z.string().default("gpt-4o"),
  CDP_API_KEY_NAME: z.string(),
  CDP_API_KEY_PRIVATE_KEY: z.string(),
  MNEMONIC_PHRASE: z.string(),
  GOLDRUSH_API: z.string(),
  PERPLEXITY_API_KEY: z.string(),
  ENABLE_PRIVATE_COMPUTE: z.boolean().default(false),
  DEFAULT_AI_PROVIDER: z.enum(['openai', 'atoma' , 'venice' , 'groq']).default('openai'),
  COOKIE_API_KEY: z.string(),
  ATOMA_API_KEY: z.string().optional(),
  STORY_PROTOCOL_ENDPOINT: z.string().default("https://api.storyprotocol.xyz/v1"),
  STORY_PROTOCOL_API_KEY: z.string(),
  STORY_RPC_PROVIDER_URL: z.string().default("https://aeneid.storyrpc.io"),
  STORY_NFT_CONTRACT: z.string().default("0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E"),
  STORY_PRIVATE_KEY: z.string(),
  RPC_PROVIDER_URL: z.string().default("https://base.llamarpc.com"),
});

export const env = envSchema.parse(process.env);

export type Environment = {
  Bindings: z.infer<typeof envSchema>;
};

export default env;
