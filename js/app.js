(function () {
  'use strict';

  /* ===== Настройки (значения по умолчанию, перекрываются config.js) ===== */
  var CFG = Object.assign({
    ENDPOINT: '', TELEGRAM_USERNAME: 'milada_dang',
    POLICY_URL: '', CONSENT_URL: '', MAX_FILES: 10, MAX_FILE_MB: 18
  }, window.BRIEF_CONFIG || {});

  var STORAGE_KEY = 'brief_draft_v1';
  var TG_LIMIT = 3800; // запас от лимита Telegram в 4096 символов
  var SEND_TIMEOUT = 20000;

  var BUDGETS = ['До 50 000 ₽', '50 000–80 000 ₽', '80 000–120 000 ₽', '120 000–200 000 ₽', 'Более 200 000 ₽', 'Пока не определились'];

  /* ===== Структура брифа ===== */
  var STEPS = [
    {
      title: 'Бизнес-задача сайта',
      desc: 'Начнём с главного: зачем вам сайт и что он должен делать для бизнеса.',
      fields: [
        { id: 'q1_why', label: 'Почему решили создать сайт именно сейчас?', important: true,
          hint: 'Что изменилось: запуск, рост, старый сайт перестал справляться. Любая причина подойдёт.' },
        { id: 'q1_task', label: 'Какую главную задачу должен решать сайт?', important: true,
          hint: 'Например: привлекать новых клиентов, продавать, собирать заявки, повышать доверие к бренду.' },
        { id: 'q1_action', label: 'Какое действие должен совершить посетитель?',
          hint: 'Оставить заявку, записаться на консультацию, купить, написать в мессенджер.' },
        { id: 'q1_priority', label: 'Какое направление или продукт в приоритете?',
          hint: 'Если у вас много услуг, подскажите, с чего начать.' }
      ]
    },
    {
      title: 'Продукт и преимущества',
      desc: 'Расскажите, что вы предлагаете и чем отличаетесь. Пишите так, как рассказали бы знакомому.',
      fields: [
        { id: 'q2_what', label: 'Что именно вы продаёте и что входит в продукт?', important: true,
          hint: 'Услуги, форматы сотрудничества, что клиент получает в итоге.' },
        { id: 'q2_top', label: 'Что покупают чаще всего и что хотите продвигать активнее?' },
        { id: 'q2_why', label: 'Почему клиенты выбирают вас? Чем подтверждаются ваши преимущества?', important: true,
          hint: 'Только то, что можно показать фактами: опыт, результаты, технологии, гарантии.' },
        { id: 'q2_limits', label: 'Есть ли особенности или ограничения продукта?',
          hint: 'География, сроки, этапы работы, условия. Всё, что важно знать заранее.' }
      ]
    },
    {
      title: 'Целевая аудитория',
      desc: 'Чем лучше я пойму ваших клиентов, тем точнее сайт будет говорить с ними.',
      fields: [
        { id: 'q3_who', label: 'Кто ваш основной клиент?', important: true,
          hint: 'Человек или компания: чем занимается, что ценит. Если клиентов несколько типов, опишите каждый.' },
        { id: 'q3_task', label: 'С какой задачей или проблемой он приходит?',
          hint: 'Что происходит в его жизни или бизнесе перед тем, как он начинает искать вас.' },
        { id: 'q3_choice', label: 'Что для него важно при выборе и что может помешать покупке?',
          hint: 'Цена, сроки, экспертность, доверие. А также сомнения и возражения, которые вы слышите чаще всего.' }
      ]
    },
    {
      title: 'Путь клиента',
      desc: 'Как человек добирается от первого знакомства с вами до покупки.',
      fields: [
        { id: 'q4_source', label: 'Откуда сейчас приходят клиенты?',
          hint: 'Соцсети, рекомендации, реклама, поиск, партнёры.' },
        { id: 'q4_path', label: 'Как проходит путь от первого обращения до покупки?',
          hint: 'Что происходит после заявки: кто связывается, как проходит консультация или оформление.' },
        { id: 'q4_lost', label: 'На каком этапе чаще всего теряются потенциальные клиенты?',
          hint: 'Если не знаете, так и напишите. Это тоже ответ.' }
      ]
    },
    {
      title: 'Ценность и доказательства',
      desc: 'Сайт должен говорить только правду, поэтому важно понять, что вы можете подтвердить.',
      fields: [
        { id: 'q5_value', label: 'За что клиенты ценят и рекомендуют компанию?',
          hint: 'Что чаще всего звучит в отзывах и личных разговорах.' },
        { id: 'q5_diff', label: 'Что компания делает иначе и чем это можно доказать?' },
        { id: 'q5_proof', label: 'Какие реальные доказательства есть?', important: true,
          hint: 'Отзывы, кейсы, результаты клиентов, сертификаты, гарантии.' },
        { id: 'q5_nope', label: 'Чего у вас нет и что нельзя обещать на сайте?', important: true,
          hint: 'Например: нет сертификатов, нет кейсов, не работаете в других городах. Так на сайте не окажется того, что нельзя подтвердить.' }
      ]
    },
    {
      title: 'Визуальный стиль',
      desc: 'Здесь про ощущения. Точных слов подбирать не нужно, достаточно направления.',
      fields: [
        { id: 'q6_impression', label: 'Какое впечатление должен производить сайт?',
          hint: 'Каким вы хотите видеть бренд глазами посетителя: доверие, спокойствие, премиальность.' },
        { id: 'q6_style', type: 'multi', label: 'Какой стиль вам близок?', hint: 'Можно выбрать несколько.',
          options: ['Минималистичный', 'Современный', 'Премиальный', 'Строгий и деловой', 'Технологичный', 'Эмоциональный и атмосферный', 'Смелый и экспериментальный', 'Естественный и спокойный'] },
        { id: 'q6_colors', label: 'Какие цвета и визуальные решения вам близки?',
          hint: 'Любимые и фирменные цвета, а также те, которых точно не хочется.' },
        { id: 'q6_refs', label: 'Есть ли сайты-референсы, которые нравятся или не нравятся?',
          hint: 'Пришлите 2–5 ссылок и коротко напишите, что именно: композиция, шрифты, фото, анимация, настроение.' }
      ]
    },
    {
      title: 'Материалы и контент',
      desc: 'Чем больше живых материалов, тем точнее получатся тексты и структура. Ничего готовить заранее не нужно.',
      fields: [
        { id: 'q7_crm', label: 'Есть ли доступ к CRM, звонкам, перепискам, причинам отказа?',
          hint: 'Это помогает услышать реальные вопросы клиентов. Передавать ничего не нужно, просто скажите, есть ли такое.' },
        { id: 'q7_voice', label: 'Какие отзывы, FAQ, звонки или переписки уже есть?' },
        { id: 'q7_materials', label: 'Есть ли сайт, презентации, прайс, документы, фото, рендеры?' },
        { id: 'q7_links', type: 'links', label: 'Ссылки на материалы', hint: 'По одной ссылке на строку.', placeholder: 'https://…' },
        { id: 'q7_files', type: 'files', label: 'Файлы', hint: 'Презентации, прайс, фото, документы. Файлы отправляются только вместе с брифом и не сохраняются в черновике.' }
      ]
    },
    {
      title: 'Условия разработки',
      desc: 'Формат, сроки и бюджет. Если ещё не определились, выберите «пока не знаю» и обсудим.',
      fields: [
        { id: 'q8_format', type: 'single', label: 'Какой формат сайта нужен?', important: true,
          options: ['Лендинг (одностраничный сайт)', 'Многостраничный сайт', 'Интернет-магазин', 'Сайт-каталог', 'Сайт эксперта', 'Пока не знаю, нужна рекомендация'] },
        { id: 'q8_deadline', type: 'text', label: 'Желаемые сроки разработки', placeholder: 'Например: до конца ноября' },
        { id: 'q8_budget', type: 'single', label: 'Планируемый бюджет', important: true, options: BUDGETS },
        { id: 'q8_extra', type: 'multi', label: 'Нужны ли дополнительные услуги?', hint: 'Можно выбрать несколько.',
          options: ['Логотип или фирменный стиль', 'Тексты для сайта', 'Подготовка изображений', 'Домен и подключение', 'Интеграции (CRM, оплата, аналитика)', 'Базовое SEO', 'Поддержка после запуска'] }
      ]
    },
    {
      title: 'Контакты',
      desc: 'Последний шаг. Оставьте, как к вам обращаться и как удобнее связаться.',
      fields: [
        { id: 'name', type: 'text', label: 'Как вас зовут?', required: true, autocomplete: 'name', error: 'Подскажите, как к вам обращаться' },
        { id: 'company', type: 'text', label: 'Название компании / проекта', autocomplete: 'organization' },
        { id: 'contact', type: 'text', label: 'Telegram, телефон или электронная почта', required: true, kind: 'contact',
          hint: 'Как вам удобнее, чтобы я с вами связалась.', placeholder: '@username, +7… или name@mail.ru',
          error: 'Укажите Telegram (@ник), телефон или e-mail' },
        { id: 'source', label: 'Где узнали обо мне и почему решили обратиться?' },
        { id: 'extra', label: 'Что-то ещё, о чём я не спросила?', hint: 'Любые пожелания, идеи и сомнения.' },
        { id: 'consent', type: 'consent', required: true, error: 'Без согласия отправить бриф не получится' }
      ]
    }
  ];

  var TOTAL = STEPS.length;

  /* ===== Состояние ===== */
  var answers = {};   // id -> строка | массив | true
  var files = [];     // File[]
  var screen = 'intro'; // intro | step | final
  var cur = 0;
  var sending = false;
  var delivered = false; // бриф доставлен: черновик больше не пишем
  var saveTimer = null;
  var statusTimer = null;
  var memStore = null; // запасное хранилище, если localStorage недоступен

  /* ===== Утилиты ===== */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }
  function reduceMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function fmtSize(b) {
    if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' КБ';
    return (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' МБ';
  }
  function filled(v) {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim() !== '';
    return !!v;
  }
  function findField(id) {
    for (var i = 0; i < STEPS.length; i++)
      for (var j = 0; j < STEPS[i].fields.length; j++)
        if (STEPS[i].fields[j].id === id) return STEPS[i].fields[j];
  }

  /* ===== Черновик (localStorage) ===== */
  function readDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* хранилище недоступно */ }
    return memStore;
  }
  function writeDraft() {
    if (delivered) return;
    var data = { answers: answers, step: screen === 'step' ? cur : (screen === 'final' ? TOTAL - 1 : -1), ts: Date.now() };
    memStore = data;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* переполнено или запрещено */ }
    flashStatus('Сохранено');
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(writeDraft, 300);
  }
  function clearDraft() {
    memStore = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }
  function flashStatus(text) {
    var el = $('#saveStatus');
    el.textContent = text;
    el.classList.add('is-on');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { el.classList.remove('is-on'); }, 1600);
  }
  function toast(text) {
    var t = $('#toast');
    t.textContent = text;
    t.classList.add('is-on');
    setTimeout(function () { t.classList.remove('is-on'); }, 4200);
  }

  /* ===== Рендер ===== */
  function fieldHTML(f) {
    var id = f.id;
    var tag = f.important ? '<span class="tag">важно</span>' : '';
    var req = f.required && f.type !== 'consent' ? '<span class="req" aria-hidden="true">*</span>' : '';
    var hint = f.hint ? '<p class="field__hint" id="' + id + '-hint">' + esc(f.hint) + '</p>' : '';
    var err = '<p class="field__error" id="' + id + '-err" role="alert">' + esc(f.error || 'Пожалуйста, заполните это поле') + '</p>';
    var describedBy = (f.hint ? id + '-hint ' : '') + id + '-err';
    var label, control;

    if (f.type === 'consent') {
      var html = '<div class="field" data-field="' + id + '">' +
        '<label class="check"><input type="checkbox" id="' + id + '" name="' + id + '" aria-describedby="' + id + '-err">' +
        '<span class="check__box"></span><span>Я даю согласие на обработку персональных данных (152-ФЗ) и принимаю ' +
        '<a href="#" data-doc="CONSENT_URL" target="_blank" rel="noopener">согласие на обработку данных</a> и ' +
        '<a href="#" data-doc="POLICY_URL" target="_blank" rel="noopener">политику конфиденциальности</a> <span class="req">*</span></span></label>' +
        err + '</div>';
      return html;
    }

    if (f.type === 'single' || f.type === 'multi') {
      var kind = f.type === 'single' ? 'radio' : 'checkbox';
      label = '<p class="field__label" id="' + id + '-label">' + esc(f.label) + tag + req + '</p>';
      control = '<div class="chips" role="' + (kind === 'radio' ? 'radiogroup' : 'group') + '" aria-labelledby="' + id + '-label" aria-describedby="' + describedBy + '">' +
        f.options.map(function (o) {
          return '<label class="chip"><input type="' + kind + '" name="' + id + '" value="' + escAttr(o) + '"><span>' + esc(o) + '</span></label>';
        }).join('') + '</div>';
      return '<div class="field" data-field="' + id + '">' + label + hint + control + err + '</div>';
    }

    if (f.type === 'files') {
      label = '<p class="field__label" id="' + id + '-label">' + esc(f.label) + '</p>';
      control = '<label class="dropzone" id="dropzone"><input type="file" id="' + id + '" multiple aria-describedby="' + describedBy + '">' +
        '<strong>Перетащите файлы сюда или нажмите, чтобы выбрать</strong>' +
        '<small>До ' + CFG.MAX_FILES + ' файлов, каждый до ' + CFG.MAX_FILE_MB + ' МБ</small></label>' +
        '<p class="files-error" id="filesError" role="alert" hidden></p><ul class="files" id="fileList"></ul>';
      return '<div class="field" data-field="' + id + '">' + label + hint + control + '</div>';
    }

    label = '<label class="field__label" for="' + id + '">' + esc(f.label) + tag + req + '</label>';
    var ph = f.placeholder ? ' placeholder="' + escAttr(f.placeholder) + '"' : '';
    var ac = f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : '';
    if (f.type === 'text') {
      control = '<input class="control" type="text" id="' + id + '" name="' + id + '"' + ph + ac + ' aria-describedby="' + describedBy + '">';
    } else {
      control = '<textarea class="control" id="' + id + '" name="' + id + '" rows="3"' + ph + ' aria-describedby="' + describedBy + '"></textarea>';
    }
    return '<div class="field" data-field="' + id + '">' + label + hint + control + err + '</div>';
  }

  function render() {
    $('#steps').innerHTML = STEPS.map(function (s, i) {
      return '<section class="step" data-step="' + i + '" aria-labelledby="st' + i + '" hidden>' +
        '<div class="container step__inner">' +
        '<div class="step__aside"><span class="num">' + pad(i + 1) + '</span>' +
        '<h2 class="step__title" id="st' + i + '" tabindex="-1">' + esc(s.title) + '</h2>' +
        '<p class="step__desc">' + esc(s.desc) + '</p></div>' +
        '<div class="step__fields">' + s.fields.map(fieldHTML).join('') + '</div>' +
        '</div></section>';
    }).join('');

    $('#introList').innerHTML = STEPS.map(function (s, i) {
      return '<li><span class="n">' + pad(i + 1) + '</span><span>' + esc(s.title) + '</span></li>';
    }).join('');

    $('#dots').innerHTML = STEPS.map(function (s, i) {
      return '<button type="button" class="dot" data-dot="' + i + '" aria-label="Этап ' + (i + 1) + ': ' + escAttr(s.title) + '"></button>';
    }).join('');

    // ссылки на документы и Telegram
    var tg = 'https://t.me/' + CFG.TELEGRAM_USERNAME;
    $('#tgBtn').href = tg;
    $$('[data-doc]').forEach(function (a) {
      var url = CFG[a.getAttribute('data-doc')];
      if (url) a.href = url;
      else { a.title = 'Документ скоро появится'; a.addEventListener('click', function (e) { e.preventDefault(); }); }
    });
    $('#year').textContent = new Date().getFullYear();
  }

  /* значения из answers -> поля */
  function fillFields() {
    $$('#form [name]').forEach(function (el) {
      var v = answers[el.name];
      if (el.type === 'radio') el.checked = v === el.value;
      else if (el.type === 'checkbox' && el.name === 'consent') el.checked = !!v;
      else if (el.type === 'checkbox') el.checked = Array.isArray(v) && v.indexOf(el.value) !== -1;
      else el.value = typeof v === 'string' ? v : '';
    });
    $$('#form textarea').forEach(grow);
  }

  function grow(el) {
    el.style.height = 'auto';
    el.style.height = (el.scrollHeight + el.offsetHeight - el.clientHeight) + 'px';
  }

  /* ===== Навигация между экранами ===== */
  function setProgress(pct) {
    $('#progressBar').style.width = pct + '%';
    $('#progress').setAttribute('aria-valuenow', Math.round(pct));
  }

  function show(name, idx, opts) {
    opts = opts || {};
    screen = name;
    if (typeof idx === 'number') cur = idx;
    $('#screenIntro').hidden = name !== 'intro';
    $('#form').hidden = name !== 'step';
    $('#screenFinal').hidden = name !== 'final';
    $('#nav').hidden = name !== 'step';
    document.body.classList.toggle('is-step', name === 'step');
    document.body.classList.toggle('is-intro', name === 'intro');

    var counter = $('#counter');
    counter.hidden = name !== 'step';

    if (name === 'step') {
      $$('.step').forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== cur; });
      counter.textContent = pad(cur + 1) + ' / ' + pad(TOTAL);
      setProgress(((cur + 1) / TOTAL) * 100);
      $('#backBtn').hidden = cur === 0;
      $('#nextBtn').textContent = cur === TOTAL - 1 ? 'Отправить' : 'Далее';
      updateDots();
      $$('.step[data-step="' + cur + '"] textarea').forEach(grow);
    } else {
      setProgress(name === 'final' ? 100 : 0);
    }

    if (!opts.silent) {
      window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
      var focusEl = name === 'step' ? $('#st' + cur) : (name === 'final' ? $('#finalTitle') : null);
      if (focusEl) focusEl.focus({ preventScroll: true });
      scheduleSave();
    }
  }

  function updateDots() {
    $$('.dot').forEach(function (d) {
      var i = Number(d.getAttribute('data-dot'));
      d.classList.toggle('is-active', i === cur);
      d.classList.toggle('is-filled', stepHasAnswers(i));
      if (i === cur) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
    });
  }
  function stepHasAnswers(i) {
    return STEPS[i].fields.some(function (f) { return f.type !== 'files' && f.type !== 'consent' && filled(answers[f.id]); });
  }

  /* ===== Валидация ===== */
  function validContact(v) {
    v = v.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return true;
    var digits = v.replace(/\D/g, '');
    if (/^[+\d][\d\s()\-+.]*$/.test(v) && digits.length >= 10 && digits.length <= 15) return true;
    return /^(https?:\/\/)?(t\.me\/)?@?[A-Za-z0-9_]{4,32}$/.test(v);
  }
  function fieldOk(f) {
    var v = answers[f.id];
    if (!f.required) return true;
    if (f.type === 'consent') return v === true;
    if (!filled(v)) return false;
    if (f.kind === 'contact') return validContact(v);
    return true;
  }
  function markField(f, ok) {
    var box = $('[data-field="' + f.id + '"]');
    if (box) box.classList.toggle('is-invalid', !ok);
    return box;
  }
  // проверяет обязательные поля этапа, возвращает первое невалидное поле или null
  function validateStep(i) {
    var first = null;
    STEPS[i].fields.forEach(function (f) {
      if (!f.required) return;
      var ok = fieldOk(f);
      var box = markField(f, ok);
      if (!ok && !first) first = box;
    });
    return first;
  }
  function focusInvalid(box) {
    box.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
    var input = $('input, textarea', box);
    if (input) input.focus({ preventScroll: true });
  }

  /* ===== Файлы ===== */
  function addFiles(list) {
    var err = $('#filesError');
    var msgs = [];
    Array.prototype.forEach.call(list, function (f) {
      if (files.length >= CFG.MAX_FILES) { msgs.push('Максимум ' + CFG.MAX_FILES + ' файлов'); return; }
      if (f.size > CFG.MAX_FILE_MB * 1024 * 1024) { msgs.push('«' + f.name + '» больше ' + CFG.MAX_FILE_MB + ' МБ'); return; }
      files.push(f);
    });
    err.hidden = msgs.length === 0;
    err.textContent = msgs.filter(function (m, i) { return msgs.indexOf(m) === i; }).join('. ');
    renderFiles();
  }
  function renderFiles() {
    var ul = $('#fileList');
    ul.innerHTML = files.map(function (f, i) {
      return '<li><span class="fname">' + esc(f.name) + '</span><span class="fsize">' + fmtSize(f.size) + '</span>' +
        '<button type="button" data-rm="' + i + '" aria-label="Удалить файл ' + escAttr(f.name) + '">×</button></li>';
    }).join('');
  }

  /* ===== Формирование сообщений для Telegram ===== */
  // Делит длинный текст по абзацам, строкам, предложениям, словам. Не рвёт фразу посередине.
  function splitText(text, max) {
    if (esc(text).length <= max) return [text];
    var seps = [/(?<=\n\n)/, /(?<=\n)/, /(?<=[.!?…] )/, /(?<= )/];
    for (var s = 0; s < seps.length; s++) {
      var parts = text.split(seps[s]);
      if (parts.length < 2) continue;
      var res = [], buf = '';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var cand = buf + p;
        if (esc(cand).length <= max) { buf = cand; continue; }
        if (buf) res.push(buf);
        if (esc(p).length > max) { res = res.concat(splitText(p, max)); buf = ''; }
        else buf = p;
      }
      if (buf) res.push(buf);
      return res.map(function (x) { return x.trim(); }).filter(Boolean);
    }
    // совсем без пробелов: режем жёстко
    var out = [], pos = 0;
    while (pos < text.length) {
      var n = Math.min(max, text.length - pos);
      while (n > 1 && esc(text.slice(pos, pos + n)).length > max) n = Math.floor(n / 2);
      out.push(text.slice(pos, pos + n));
      pos += n;
    }
    return out;
  }

  function valueText(f) {
    var v = answers[f.id];
    if (Array.isArray(v)) return v.join(', ');
    return typeof v === 'string' ? v.trim() : '';
  }

  // блоки «вопрос + ответ» одного этапа (только заполненные)
  function stepBlocks(step) {
    var blocks = [];
    step.fields.forEach(function (f) {
      if (f.type === 'consent') return;
      var text;
      if (f.type === 'files') {
        if (!files.length) return;
        text = files.map(function (x) { return x.name + ' (' + fmtSize(x.size) + ')'; }).join('\n');
      } else {
        text = valueText(f);
      }
      if (!text) return;
      var q = '<b>' + esc(f.label) + '</b>';
      var room = TG_LIMIT - q.length - 400;
      var chunks = splitText(text, room);
      blocks.push(q + '\n' + esc(chunks[0]));
      for (var i = 1; i < chunks.length; i++) blocks.push(esc(chunks[i]));
    });
    return blocks;
  }

  function packStep(title, blocks) {
    var msgs = [], head = '<b>' + esc(title) + '</b>', headMore = '<b>' + esc(title) + ' (продолжение)</b>';
    var curMsg = head, count = 0;
    blocks.forEach(function (b) {
      if (count > 0 && curMsg.length + 2 + b.length > TG_LIMIT) {
        msgs.push(curMsg);
        curMsg = headMore; count = 0;
      }
      curMsg += '\n\n' + b; count++;
    });
    if (count > 0) msgs.push(curMsg);
    return msgs;
  }

  function cut(s, n) { s = s.replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }

  function buildMessages() {
    var msgs = [];
    var sum = ['<b>Новый бриф на сайт</b>'];
    function line(label, v) { if (v) sum.push('<b>' + label + ':</b> ' + esc(v)); }
    line('Имя', valueText({ id: 'name' }));
    line('Проект', valueText({ id: 'company' }));
    line('Контакт', valueText({ id: 'contact' }));
    line('Формат сайта', valueText({ id: 'q8_format' }));
    line('Бюджет', valueText({ id: 'q8_budget' }));
    line('Сроки', valueText({ id: 'q8_deadline' }));
    line('Задача сайта', cut(valueText({ id: 'q1_task' }), 400));
    line('В приоритете', cut(valueText({ id: 'q1_priority' }), 300));
    if (files.length) line('Файлов в брифе', String(files.length));
    msgs.push(sum.join('\n'));

    STEPS.forEach(function (s, i) {
      var blocks = stepBlocks(s);
      if (blocks.length) msgs = msgs.concat(packStep(pad(i + 1) + ' · ' + s.title, blocks));
    });
    return msgs;
  }

  // текстовая копия ответов для скачивания
  function buildText() {
    var out = ['БРИФ НА РАЗРАБОТКУ САЙТА', 'Дата: ' + new Date().toLocaleString('ru-RU'), ''];
    STEPS.forEach(function (s, i) {
      var part = [];
      s.fields.forEach(function (f) {
        if (f.type === 'consent') return;
        var text = f.type === 'files'
          ? files.map(function (x) { return x.name + ' (' + fmtSize(x.size) + ')'; }).join('\n')
          : valueText(f);
        if (text) part.push(f.label + '\n' + text);
      });
      if (part.length) out.push(pad(i + 1) + ' · ' + s.title.toUpperCase(), '', part.join('\n\n'), '');
    });
    if (answers.consent) out.push('Согласие на обработку персональных данных: дано');
    return out.join('\n');
  }

  function downloadCopy() {
    var text = '﻿' + buildText();
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'brief-' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ===== Отправка ===== */
  function post(body, headers) {
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, SEND_TIMEOUT);
    var opts = { method: 'POST', body: body, headers: headers || {} };
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(CFG.ENDPOINT, opts).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
    }, function (e) { clearTimeout(timer); throw e; });
  }

  function showFinal(state, failedFiles) {
    var ok = state === 'sent';
    $('#finalTitle').innerHTML = ok ? 'Спасибо!' : 'Почти <em>готово</em>';
    $('#finalLead').textContent = ok
      ? 'Ваш бриф уже у меня. Я внимательно изучу ответы и скоро вернусь к вам с обратной связью.'
      : 'Все ваши ответы сохранены. Осталось передать их мне.';
    var notice = $('#finalNotice'), text = $('#finalNoticeText');
    var note = '';
    if (state === 'manual') note = 'Автоматическая отправка пока не подключена. Скачайте файл с ответами и пришлите его мне в Telegram.';
    if (state === 'error') note = 'Не удалось отправить ответы: возможно, пропала связь. Ничего не потеряно. Повторите отправку или скачайте файл с ответами и пришлите его мне в Telegram.';
    if (ok && failedFiles && failedFiles.length) note = 'Ответы дошли, но не все файлы удалось отправить (' + failedFiles.join(', ') + '). Пришлите их мне в Telegram.';
    notice.hidden = !note;
    text.textContent = note;
    $('#retryBtn').hidden = state !== 'error';
    show('final');
  }

  function submit() {
    if (sending) return;
    // проверяем обязательные поля на всех этапах, переходим к первому проблемному
    for (var i = 0; i < TOTAL; i++) {
      var bad = validateStep(i);
      if (bad) {
        if (i !== cur) {
          show('step', i);
          setTimeout(function () { focusInvalid(bad); }, 120);
        } else focusInvalid(bad);
        return;
      }
    }
    writeDraft();

    if (!CFG.ENDPOINT) { showFinal('manual'); return; }

    sending = true;
    var btn = $('#nextBtn');
    btn.disabled = true; btn.textContent = 'Отправляем…';

    deliver().then(function (failed) {
      delivered = true;
      clearDraft();
      showFinal('sent', failed);
    }, function () {
      showFinal('error');
    }).then(function () {
      sending = false; btn.disabled = false;
    });
  }

  // сначала сообщения (это главное), потом файлы по одному
  function deliver() {
    var body = JSON.stringify({ messages: buildMessages() });
    return post(body, { 'Content-Type': 'application/json' }).then(function () {
      var failed = [];
      var caption = 'Файл из брифа: ' + (answers.name || '') + ' ' + (answers.contact || '');
      return files.reduce(function (chain, f) {
        return chain.then(function () {
          var fd = new FormData();
          fd.append('file', f, f.name);
          fd.append('caption', caption.trim());
          return post(fd).catch(function () { failed.push(f.name); });
        });
      }, Promise.resolve()).then(function () { return failed; });
    });
  }

  /* ===== События ===== */
  function onInput(e) {
    var el = e.target;
    if (!el.name || el.type === 'file') return;
    if (el.type === 'radio') answers[el.name] = el.value;
    else if (el.name === 'consent') answers.consent = el.checked;
    else if (el.type === 'checkbox') {
      answers[el.name] = $$('input[name="' + el.name + '"]:checked').map(function (c) { return c.value; });
    } else answers[el.name] = el.value;

    if (el.tagName === 'TEXTAREA') grow(el);
    // убираем подсветку ошибки, как только поле стало корректным
    var f = findField(el.name);
    if (f && f.required && fieldOk(f)) markField(f, true);
    updateDots();
    scheduleSave();
  }

  function bind() {
    $('#form').addEventListener('input', onInput);
    $('#form').addEventListener('change', onInput);
    $('#form').addEventListener('submit', function (e) { e.preventDefault(); });

    $('#startBtn').addEventListener('click', function () { show('step', 0); });
    $('#backBtn').addEventListener('click', function () { if (cur > 0) show('step', cur - 1); });
    $('#nextBtn').addEventListener('click', function () {
      if (cur === TOTAL - 1) { submit(); return; }
      var bad = validateStep(cur);
      if (bad) { focusInvalid(bad); return; }
      show('step', cur + 1);
    });
    $('#dots').addEventListener('click', function (e) {
      var d = e.target.closest('.dot');
      if (d) show('step', Number(d.getAttribute('data-dot')));
    });

    // файлы
    var input = $('#q7_files'), dz = $('#dropzone');
    input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(function (n) {
      dz.addEventListener(n, function (e) { e.preventDefault(); dz.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (n) {
      dz.addEventListener(n, function (e) { e.preventDefault(); dz.classList.remove('is-over'); });
    });
    dz.addEventListener('drop', function (e) { if (e.dataTransfer) addFiles(e.dataTransfer.files); });
    $('#fileList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]');
      if (!b) return;
      files.splice(Number(b.getAttribute('data-rm')), 1);
      $('#filesError').hidden = true;
      renderFiles();
    });

    $('#downloadBtn').addEventListener('click', downloadCopy);
    $('#retryBtn').addEventListener('click', function () { show('step', TOTAL - 1); submit(); });

    $('#resetBtn').addEventListener('click', function () {
      if (!confirm('Удалить все введённые ответы и начать заново?')) return;
      clearDraft();
      answers = {}; files = [];
      renderFiles(); fillFields();
      $$('.field.is-invalid').forEach(function (f) { f.classList.remove('is-invalid'); });
      show('intro', 0, { silent: true });
      window.scrollTo(0, 0);
      toast('Черновик очищен');
    });

    window.addEventListener('resize', function () { $$('.step:not([hidden]) textarea').forEach(grow); });
    // перед закрытием вкладки сохраняем немедленно
    window.addEventListener('pagehide', function () { clearTimeout(saveTimer); if (Object.keys(answers).length) writeDraft(); });
  }

  /* ===== Запуск ===== */
  render();
  bind();

  var draft = readDraft();
  var hasDraft = draft && draft.answers && Object.keys(draft.answers).some(function (k) { return filled(draft.answers[k]); });
  if (hasDraft) {
    answers = draft.answers;
    fillFields();
    var start = typeof draft.step === 'number' && draft.step >= 0 ? Math.min(draft.step, TOTAL - 1) : 0;
    show('step', start, { silent: true });
    toast('Черновик восстановлен');
  } else {
    show('intro', 0, { silent: true });
  }
})();
