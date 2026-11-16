import {handleLeadRequest} from '@/lib/leads/http';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  return handleLeadRequest(request, 'website_estimate');
}
