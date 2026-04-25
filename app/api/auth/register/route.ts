import { NextResponse, type NextRequest } from 'next/server';
import { backendFetch } from '../../../lib/bff-proxy';
import { setSession } from '../../../lib/session';

interface BackendAuthResponse {
  access_token: string;
  refresh_token: string;
  customer: {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  expires_in?: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.first_name || !body?.last_name) {
    return NextResponse.json(
      { message: 'Email, contraseña, nombre y apellido son requeridos' },
      { status: 400 },
    );
  }

  const { ok, status, data } = await backendFetch<BackendAuthResponse>(
    '/ecommerce-auth/register',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  if (!ok || !data) {
    return NextResponse.json(data ?? { message: 'No se pudo registrar' }, { status });
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

  return NextResponse.json({ customer: data.customer });
}
