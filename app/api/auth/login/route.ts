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
  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: 'Email y contraseña requeridos' }, { status: 400 });
  }

  const { ok, status, data } = await backendFetch<BackendAuthResponse>(
    '/ecommerce-auth/login',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  if (!ok || !data) {
    return NextResponse.json(data ?? { message: 'Credenciales inválidas' }, { status });
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

  // Devolvemos solo el customer. Los tokens viven en cookie httpOnly.
  return NextResponse.json({ customer: data.customer });
}
