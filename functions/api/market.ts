import { marketApiResponse } from '../../src/server/marketService';

/** Cloudflare Pages Functions: GET /api/market (same origin as the site). */
export async function onRequestGet(): Promise<Response> {
  return marketApiResponse();
}
