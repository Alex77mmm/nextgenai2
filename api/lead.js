const ALLOWED_ORIGINS = new Set([
  'https://nextgenrussia.ru',
  'https://www.nextgenrussia.ru',
]);

module.exports = async function handler(request, response) {
  const origin = request.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'POST') return response.status(405).json({ ok: false });
  if (!ALLOWED_ORIGINS.has(origin)) return response.status(403).json({ ok: false });

  const { phone = '', comment = '', website = '' } = request.body || {};
  if (website) return response.status(200).json({ ok: true });

  const cleanPhone = String(phone).trim().slice(0, 40);
  const cleanComment = String(comment).trim().slice(0, 1000);
  if (!/^[+\d][\d\s()\-]{6,39}$/.test(cleanPhone)) {
    return response.status(400).json({ ok: false, error: 'invalid_phone' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return response.status(503).json({ ok: false });

  const text = [
    '🔔 Новая заявка с nextgenrussia.ru',
    '',
    `📞 Телефон: ${cleanPhone}`,
    `💬 Комментарий: ${cleanComment || '—'}`,
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!telegramResponse.ok) throw new Error('Telegram request failed');
    return response.status(200).json({ ok: true });
  } catch {
    return response.status(502).json({ ok: false });
  }
};
