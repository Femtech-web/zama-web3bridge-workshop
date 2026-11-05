import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateDeployment, SEPOLIA_CHAIN_ID } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configured = process.env.PAYROLL_ADDRESS;
    const raw: unknown = configured
      ? {
          chainId: SEPOLIA_CHAIN_ID,
          payroll: configured,
          publicToken: process.env.PUBLIC_TOKEN_ADDRESS,
          wrapper: process.env.CONFIDENTIAL_TOKEN_ADDRESS,
          employer: process.env.EMPLOYER_ADDRESS,
        }
      : JSON.parse(await readFile(join(process.cwd(), "deployment.json"), "utf8"));
    return Response.json(validateDeployment(raw), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      {
        error:
          "Sepolia deployment is not configured. Deploy with npm run deploy:sepolia from this project root, or configure the four server-side addresses in frontend/.env.local.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
