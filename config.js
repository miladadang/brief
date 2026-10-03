// Настройки брифа. Меняйте здесь — код трогать не нужно.
window.BRIEF_CONFIG = {
  // Адрес Cloudflare Worker, который пересылает ответы в Telegram (см. worker/worker.js).
  // Пока пусто — вместо отправки форма предложит скачать файл с ответами.
  ENDPOINT: '',

  // Ник в Telegram без @ (кнопки «Написать в Telegram» и «Связаться»)
  TELEGRAM_USERNAME: 'milada_dang',

  // Ссылки на документы (появятся в согласии и в подвале)
  POLICY_URL: 'policy/',
  CONSENT_URL: '',

  // Ограничения на файлы
  MAX_FILES: 10,
  MAX_FILE_MB: 18
};
