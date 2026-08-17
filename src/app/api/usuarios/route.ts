import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function err(e: unknown, status = 400) {
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(request: Request) {
  try {
    const { payload } = await request.json();
    const { data, error } = await getClient()
      .from('usuarios')
      .insert([payload])
      .select()
      .single();
    if (error) return err(error.message);
    return NextResponse.json({ data });
  } catch (e) {
    return err(e, 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, payload } = await request.json();
    const { data, error } = await getClient()
      .from('usuarios')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) return err(error.message);
    return NextResponse.json({ data });
  } catch (e) {
    return err(e, 500);
  }
}
