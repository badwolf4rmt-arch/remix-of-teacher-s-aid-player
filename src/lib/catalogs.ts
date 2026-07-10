export const SUBJECT_CATALOG = [
  "Русский язык",
  "Литературное чтение",
  "Родной язык",
  "Литературное чтение на родном языке",
  "Английский язык",
  "Китайский язык",
  "Немецкий язык",
  "Математика",
  "Окружающий мир",
  "Основы религиозных культур и светской этики",
  "Изобразительное искусство",
  "Музыка",
  "Технология",
  "Физическая культура",
  "Алгебра",
  "Алгебра и начала математического анализа",
  "Астрономия",
  "Биология",
  "Вероятность и статистика",
  "География",
  "Геометрия",
  "Естествознание",
  "Информатика",
  "Испанский язык",
  "История",
  "Литература",
  "ОБЖ",
  "Основы безопасности жизнедеятельности",
  "Обществознание",
  "ОДНКР",
  "Основы безопасности и защиты Родины",
  "Право",
  "Родная литература",
  "Россия в мире",
  "Физика",
  "Химия",
  "Экология",
  "Экономика",
  "Другое",
] as const;

export const GRADE_CATALOG = Array.from({ length: 11 }, (_, index) => String(index + 1));

export const TASK_FORMATS = [
  { id: "", label: "Любой (пусть выберет ИИ)" },
  { id: "игра", label: "Игра" },
  { id: "кейс", label: "Кейс" },
  { id: "необычный_факт", label: "Необычный факт" },
  { id: "творческое", label: "Творческое" },
  { id: "дискуссия", label: "Дискуссия" },
  { id: "исследование", label: "Исследование" },
] as const;

export type TaskFormat = (typeof TASK_FORMATS)[number]["id"];

export type FormDraft = {
  subject: string;
  grade: string;
  topic: string;
  isNewTopic: boolean;
  format: TaskFormat;
  additionalRequest: string;
};

export const DEFAULT_FORM: FormDraft = {
  subject: "",
  grade: "",
  topic: "",
  isNewTopic: true,
  format: "",
  additionalRequest: "",
};
