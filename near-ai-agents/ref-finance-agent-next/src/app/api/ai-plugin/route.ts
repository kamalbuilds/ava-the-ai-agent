import { NextResponse } from "next/server";
import { DEPLOYMENT_URL } from "vercel-url";

/**
 * Return the OpenAI plugin manifest
 * This endpoint is used by AI systems to discover the capabilities of this agent
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const pluginManifest = {
    schema_version: 'v1',
    name_for_human: 'REF Finance Agent',
    name_for_model: 'ref_finance_agent',
    description_for_human: 'REF Finance Agent for DeFi operations on the NEAR Protocol.',
    description_for_model: 'REF Finance Agent enables AI to interact with the REF Finance DeFi protocol on NEAR blockchain. It allows token swapping, pool analysis, price checking, and other DeFi operations.',
    auth: {
      type: 'none'
    },
    api: {
      type: 'openapi',
      url: `${baseUrl}/api/ai-plugin/openapi.json`,
      is_user_authenticated: false
    },
    logo_url: `${baseUrl}/api/ai-plugin/logo.png`,
    contact_email: 'support@ava.finance',
    legal_info_url: 'https://ava.finance/legal'
  };

  return NextResponse.json(pluginManifest);
}
