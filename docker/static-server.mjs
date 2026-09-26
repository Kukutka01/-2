// Минимальный статический сервер для workerd (service "static").
// Отдаёт файлы из disk-директории, переданной в env.STATIC_DIR.
// Используется entrypoint.sh для идемпотентной инициализации схемы БД:
// init-скрипт скачивает docker/migrations.sql через fetch() с этого сервиса
// (в standalone workerd нет ни D1 durableSqlStorage, ни text-модулей).
export default {
  async fetch(request) {
    let path;
    try {
      path = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return new Response('Bad Request', { status: 400 });
    }
    if (path === '/' || path.includes('..')) {
      return new Response('Not Found', { status: 404 });
    }
    try {
      const file = await this.env.STATIC.openFile(path);
      const body = file.read().getStream();
      // read() возвращает stream только что открытого файла — не кэшируем,
      // иначе повторные запросы получат уже исчерпанный поток.
      return new Response(body, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  },
};
