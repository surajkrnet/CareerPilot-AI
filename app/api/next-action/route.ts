import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (process.env.N8N_WEBHOOK_NEXT_ACTION) {
      fetch(process.env.N8N_WEBHOOK_NEXT_ACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'next_best_action_requested',
          payload: body,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => console.warn('n8n next-action notice:', err.message));
    }

    return NextResponse.json({
      success: true,
      recommendation: {
        title: 'Run a JD-Aligned Mock Interview',
        description: 'Prepare for your upcoming interview rounds with real-time STAR feedback.',
        actionHref: '/interview',
        actionLabel: 'Launch Mock Studio',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
