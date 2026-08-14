import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Intelligent Routing: Query public.career_dna for user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dna } = await supabase
          .from('career_dna')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dna) {
          return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
        } else {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
      return NextResponse.redirect(`${origin}${next || '/dashboard'}`);
    }
  }

  // Verification failed, redirect back to auth with message
  return NextResponse.redirect(`${origin}/auth?error=Authentication%20verification%20failed`);
}
