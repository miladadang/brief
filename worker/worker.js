// Cloudflare Worker: принимает бриф с сайта и пересылает его в Telegram.
// Переменные (Settings → Variables → Secrets):
//   BOT_TOKEN       — токен бота от @BotFather
//   CHAT_ID         — id чата, куда слать ответы
//   ALLOWED_ORIGIN  — адрес сайта, например https://username.github.io (необязательно, по умолчанию *)

const TG = (token, method) => `https://api.telegram.org/bot${token}/${method}`;

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    const reply = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply({ ok: false, error: 'method' }, 405);

    try {
      const type = request.headers.get('Content-Type') || '';

      // Файл из брифа
      if (type.includes('multipart/form-data')) {
        const form = await request.formData();
        const file = form.get('file');
        if (!file || typeof file === 'string') return reply({ ok: false, error: 'no file' }, 400);
        const out = new FormData();
        out.append('chat_id', env.CHAT_ID);
        out.append('document', file, file.name);
        const caption = String(form.get('caption') || '').slice(0, 1000);
        if (caption) out.append('caption', caption);
        const r = await fetch(TG(env.BOT_TOKEN, 'sendDocument'), { method: 'POST', body: out });
        return reply({ ok: r.ok }, r.ok ? 200 : 502);
      }

      // Текстовые сообщения: по очереди, чтобы сохранить порядок
      const { messages } = await request.json();
      if (!Array.isArray(messages) || !messages.length) return reply({ ok: false, error: 'empty' }, 400);

      for (const text of messages.slice(0, 40)) {
        let done = false;
        for (let attempt = 0; attempt < 3 && !done; attempt++) {
          const r = await fetch(TG(env.BOT_TOKEN, 'sendMessage'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: env.CHAT_ID,
              text: String(text).slice(0, 4096),
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            }),
          });
          if (r.ok) { done = true; break; }
          if (r.status === 429) {
            const j = await r.json().catch(() => ({}));
            await new Promise((res) => setTimeout(res, ((j.parameters && j.parameters.retry_after) || 1) * 1000));
          } else {
            return reply({ ok: false, error: 'telegram' }, 502);
          }
        }
        if (!done) return reply({ ok: false, error: 'telegram' }, 502);
      }
      return reply({ ok: true });
    } catch (e) {
      return reply({ ok: false, error: 'server' }, 500);
    }
  },
};
