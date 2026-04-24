import { NextResponse, type NextRequest } from 'next/server';
import { backendFetch } from '../../../lib/bff-proxy';
import { setSession } from '../../../lib/session';

interface BackendGoogleResponse {
  access_token: string;
  refresh_token: string;
  customer: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  was_linked?: boolean;
  is_new_account?: boolean;
  expires_in?: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id_token) {
    return NextResponse.json({ message: 'id_token requerido' }, { status: 400 });
  }

  const { ok, status, data } = await backendFetch<BackendGoogleResponse>(
    '/ecommerce-auth/google',
    {
      method: 'POST',
      body: JSON.stringify({ id_token: body.id_token }),
    },
  );

  if (!ok || !data) {
    return NextResponse.json(data ?? { message: 'Google auth falló' }, { status });
  }

  await setSession({
    user_id: data.customer.user_id,
    email: data.customer.email,
    first_name: data.customer.first_name,
    last_name: data.customer.last_name,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
  });

  return NextResponse.json({
    customer: data.customer,
    was_linked: data.was_linked,
    is_new_account: data.is_new_account,
  });
}
