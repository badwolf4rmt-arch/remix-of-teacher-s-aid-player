# План: перенос фронта motivation_task_stand в новый проект

## Что переносим из архива
Только UI-слой. Логика генерации ИИ, OpenRouter, Google Sheets и связанные утилиты — не переносим.

**Забираем:**
- `TaskInputForm.tsx` (первый экран — параметры) + `SearchableCombobox.tsx`, `FormatPicker.tsx`, `FormatDropdown.tsx`
- `MarkdownContent.tsx` (рендер markdown + LaTeX через KaTeX)
- `lib/catalogs.ts` (справочники предметов/классов)
- `lib/normalizeMarkdownMath.ts`, `lib/normalizeRussianQuotes.ts` (чистые утилиты для markdown)
- CSS-переменные и базовые стили из `app/globals.css` (адаптированные под Tailwind v4 токены)

**Не забираем:** всё в `app/api/`, `GenerationModal`, `StandPage`, `TaskDocument`, `openrouter.ts`, `googleSheets*`, `illustration*`, `imageBrief*`, `parseTaskResult*`, `defaultSystemPrompt*`, `hintSession*`, `richTextMarkdown*` и пр. — это ИИ/бэк.

## Экран 1: Параметры задания
Без изменений по логике. Форма (`FormDraft`: subject, grade, topic, isNewTopic, format, additionalRequest) + кнопка «Начать». По клику — переход на экран плеера, параметры пробрасываются в state.

## Экран 2: Плеер контента
Layout — три колонки:

```text
┌─────────── Sticky Header ────────────────────────────┐
│ Пользователь [input]  Модель [Claude/Gemini]         │
│                              [Настройки промптов ⚙] │
├──────────┬──────────────────────┬────────────────────┤
│ Оценка   │  Задание (md+LaTeX)  │ Заметки учителя    │
│ (левая)  │                      │ (md+LaTeX)         │
│          │                      │                    │
└──────────┴──────────────────────┴────────────────────┘
```

- **Центр «Задание»** и **право «Заметки для учителя»** — рендерят markdown+LaTeX через `react-markdown` + `remark-math` + `rehype-katex`. Показываем демо-контент (пример задачи по математике с формулами вида $\frac{a}{b}$, $E=mc^2$) — заглушка до подключения ИИ.
- **Левая колонка «Ваша оценка»** — точно как на скрине:
  - чекбокс «Разметка в порядке»
  - 8 критериев (Методическая логика, Предметная точность, Правильные ответы, Качество речи, Полнота, Соответствие примеров теории, Оформление структуры, Соответствие запросу) — segmented control из 4 сегментов (плохо / скорее плохо / скорее хорошо / хорошо) с цветами red/orange/blue/green
  - «Общее впечатление» — 5 звёзд
  - Textarea «Комментарий»
  - Кнопка «Отправить» — активна, когда заполнены все критерии; сохраняет запись в Supabase (Lovable Cloud)

## Верхняя панель (sticky)
- Поле **«Пользователь»** — text input, значение хранится в localStorage
- Селект **«Модель»** — Claude / Gemini
- Кнопка **«Настройки промптов»** → открывает Sheet/Dialog с тремя textarea:
  1. Этап 1 (задание и заметки)
  2. Этап 2 (запрос на изображение)
  3. Этап 3 (генерация изображения)
- Значения промптов и выбранной модели хранятся в localStorage (позже подхватит бэк)

## Хранилище оценок (Lovable Cloud / Supabase)
Включаем Lovable Cloud. Таблица `evaluations`:

| колонка | тип |
|---|---|
| id | uuid PK |
| created_at | timestamptz |
| user_name | text |
| model | text |
| params | jsonb — входные параметры экрана 1 |
| markup_ok | boolean |
| scores | jsonb — { methodicalLogic: 1..4, ... } |
| overall_stars | int |
| comment | text |
| task_content | text — снапшот задания |
| teacher_notes | text — снапшот заметок |

RLS: включена. Политики — `TO anon` INSERT и SELECT (стенд внутренний, аутентификации нет). Экспорт делаешь через Cloud UI когда угодно. GRANT INSERT, SELECT на `anon` и ALL на `service_role`.

## Технические детали
- Стек проекта — TanStack Start + Tailwind v4 + shadcn. Оригинал был Next.js, поэтому весь UI переписываем под этот стек (компоненты shadcn: `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Sheet`, `Card`).
- Роуты: `/` — форма параметров; `/player` — плеер. Параметры экрана 1 передаём через `sessionStorage` (простая передача между роутами, без URL-мусора).
- Markdown+LaTeX: `bun add react-markdown remark-math rehype-katex katex remark-gfm` + импорт `katex/dist/katex.min.css` в `styles.css` (через `<link>` в `__root.tsx`, т.к. Tailwind v4 не резолвит удалённые @import — но katex ставится локально, так что обычный import работает).
- Head: реальный `title` "Стенд генерации заданий" и описание в `__root.tsx`.
- Дизайн-токены: добавляем в `styles.css` цвета для 4-уровневой оценочной шкалы (red/orange/blue/green) как семантические переменные, не хардкодим в компонентах.

## Что НЕ делаем в этой итерации
- Никаких вызовов ИИ, никаких серверных функций генерации.
- Промпты не отправляются никуда, только сохраняются локально.
- Тексты промптов пользователь пришлёт позже — сейчас поля пустые с плейсхолдерами.
