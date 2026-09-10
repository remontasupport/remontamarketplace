import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/auth';

/**
 * POST /api/admin/chat
 * Sends user messages to n8n webhook and returns AI response
 */
export async function POST(req: NextRequest) {
  try {
    // Require admin role
    await requireRole(UserRole.ADMIN);

    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with your n8n webhook URL
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/chat';

    // Send message to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook returned status ${response.status}`);
    }

    const data = await response.json();

    // Extract the output from n8n AI Agent response
    // n8n returns: [{ "output": "AI response text" }]
    let aiResponse = '';

    if (Array.isArray(data) && data.length > 0 && data[0].output) {
      // n8n AI Agent format
      aiResponse = data[0].output;
    } else if (data.output) {
      // Direct output field
      aiResponse = data.output;
    } else if (data.response) {
      // Generic response field
      aiResponse = data.response;
    } else if (data.message) {
      // Generic message field
      aiResponse = data.message;
    } else if (typeof data === 'string') {
      // Plain string response
      aiResponse = data;
    } else {
      // Fallback: stringify the entire response
      aiResponse = JSON.stringify(data);
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process chat message',
      },
      { status: 500 }
    );
  }
}
