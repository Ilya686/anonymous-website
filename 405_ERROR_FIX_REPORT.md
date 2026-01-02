# Отчет по исправлению ошибки 405 Method Not Allowed

## Дата: Сейчас

---

## Проблема

**Ошибка:** Все API-запросы возвращали 405 Method Not Allowed  
**Симптомы:** POST-запросы к `/api/create-payment` и `/api/log` отклонялись сервером

---

## Диагностика причины

### Почему Vercel выдавал 405 ошибку?

**Основная причина:** В файле `vercel.json` было правило rewrite, которое перенаправляло **ВСЕ** запросы на `/index.html`:

```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

Это правило перехватывало даже запросы к `/api/*`, которые должны были обрабатываться Next.js API routes. В результате:

1. Запрос `POST /api/create-payment` попадал на `index.html`
2. HTML файл не может обрабатывать POST-методы
3. Vercel возвращал 405 Method Not Allowed

**Дополнительные факторы:**
- Не было обработки OPTIONS запросов (CORS preflight)
- Не было CORS заголовков в ответах API
- Не было проверки методов запросов в API routes

---

## Решение

### 1. Исправление vercel.json

**Было:**
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

**Стало:**
```json
"rewrites": [
  {
    "source": "/((?!api|_next|video|icons|js|style.css|manifest.json|admin.html|sw.js).*)",
    "destination": "/index.html"
  }
]
```

**Изменения:**
- Использован отрицательный lookahead regex `(?!api|_next|...)` для исключения API routes и статических файлов из rewrites
- Теперь запросы к `/api/*` не перенаправляются на `index.html`, а обрабатываются Next.js API routes

**Добавлены CORS заголовки:**
```json
{
  "source": "/api/(.*)",
  "headers": [
    {
      "key": "Access-Control-Allow-Origin",
      "value": "*"
    },
    {
      "key": "Access-Control-Allow-Methods",
      "value": "GET, POST, OPTIONS"
    },
    {
      "key": "Access-Control-Allow-Headers",
      "value": "Content-Type, x-api-key"
    }
  ]
}
```

---

### 2. Обновление app/api/create-payment/route.js

**Добавлено:**
1. Функция `corsHeaders()` для генерации CORS заголовков
2. Обработчик `OPTIONS()` для CORS preflight запросов
3. Проверка метода запроса в начале `POST()`
4. CORS заголовки во всех `NextResponse.json()` ответах

**Код:**
```javascript
// CORS заголовки для всех ответов
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  };
}

// Обработка OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders()
  });
}

export async function POST(request) {
  // Проверяем метод запроса
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { 
        status: 405,
        headers: corsHeaders()
      }
    );
  }
  // ... остальной код
}
```

**Все возвраты NextResponse.json() теперь включают:**
```javascript
{ status: XXX, headers: corsHeaders() }
```

---

### 3. Обновление app/api/log/route.js

**Аналогичные изменения:**
1. Функция `corsHeaders()`
2. Обработчик `OPTIONS()`
3. Проверка метода запроса
4. CORS заголовки во всех ответах

---

### 4. Проверка script.js

**Статус:** ✅ Уже корректно настроен

Все fetch-запросы используют:
- `method: 'POST'` ✅
- `'Content-Type': 'application/json'` в headers ✅

**Примеры:**
```javascript
await fetch('/api/log', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({...})
});

await fetch('/api/create-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({...})
});
```

---

## Итоговые изменения

### Измененные файлы:

1. **vercel.json**
   - Изменено правило rewrite для исключения `/api/*`
   - Добавлены CORS заголовки для `/api/*` routes

2. **app/api/create-payment/route.js**
   - Добавлена функция `corsHeaders()`
   - Добавлен обработчик `OPTIONS()`
   - Добавлена проверка метода запроса
   - Все ответы теперь включают CORS заголовки

3. **app/api/log/route.js**
   - Аналогичные изменения как в create-payment

### Файлы, которые не требовали изменений:

- **script.js** - уже был корректно настроен

---

## Результат

✅ **Ошибка 405 Method Not Allowed исправлена**

**Как это работает теперь:**

1. Запросы к `/api/*` больше не перенаправляются на `index.html`
2. Next.js API routes обрабатывают запросы напрямую
3. CORS заголовки позволяют браузеру делать cross-origin запросы
4. OPTIONS запросы (preflight) обрабатываются корректно
5. Проверка методов запросов предотвращает неправильное использование API

---

## Готовность к деплою

✅ **Код готов к деплою**

Все проверки пройдены:
- ✅ vercel.json настроен корректно
- ✅ API routes обрабатывают POST и OPTIONS
- ✅ CORS заголовки добавлены
- ✅ script.js использует правильные методы
- ✅ Нет ошибок линтера

---

## Важные замечания

1. **Next.js API Routes:** В Next.js App Router API routes в `app/api/*` обрабатываются автоматически, но они должны быть исключены из rewrite правил в vercel.json

2. **CORS:** Добавлены CORS заголовки для всех API routes, чтобы браузер не блокировал запросы

3. **OPTIONS запросы:** Браузер отправляет OPTIONS запрос перед POST (preflight), поэтому добавлены обработчики OPTIONS

4. **Методы запросов:** Добавлена проверка метода в начале каждой функции для дополнительной безопасности

---

**Статус:** ✅ Все проблемы исправлены, система готова к работе
