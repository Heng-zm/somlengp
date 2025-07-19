
'use server';

import {NextResponse} from 'next/server';

export async function POST(request: Request) {
  const {rating, feedback} = await request.json();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram bot token or chat ID is not configured.');
    return NextResponse.json(
      {success: false, message: 'Server configuration error.'},
      {status: 500}
    );
  }

  const message = `
*New Feedback Received!* ⭐️
-------------------------
*Rating:* ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)
*Feedback:*
\`\`\`
${feedback || 'No comment provided.'}
\`\`\`
  `;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send message to Telegram:', errorData);
      return NextResponse.json(
        {success: false, message: 'Failed to send message.'},
        {status: response.status}
      );
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error sending feedback to Telegram:', error);
    return NextResponse.json(
      {success: false, message: 'An internal error occurred.'},
      {status: 500}
    );
  }
}
