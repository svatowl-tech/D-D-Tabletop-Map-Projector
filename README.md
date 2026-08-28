# ⚔️ VTT-ZERO: Tabletop Map Projector

[![CI Status](https://img.shields.io/github/actions/workflow/status/SvatOwl/vtt-zero-tabletop-projector/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/SvatOwl/vtt-zero-tabletop-projector/actions)
[![Release Status](https://img.shields.io/github/actions/workflow/status/SvatOwl/vtt-zero-tabletop-projector/release.yml?label=Release%20Build&style=flat-square)](https://github.com/SvatOwl/vtt-zero-tabletop-projector/releases)
[![License](https://img.shields.io/badge/License-MIT-orange.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Web-blue?style=flat-square)](#-platform-packages)
[![RAM Usage](https://img.shields.io/badge/RAM%20Usage-%3C%2025%20MB-green?style=flat-square)](#-performance--hardware)

**VTT-ZERO** — ультра-легковесный автономный инструмент для мастеров настольных ролевых игр (D&D, Pathfinder, Call of Cthulhu, Savage Worlds). Позволяет мгновенно выводить боевые карты и туман войны на второй монитор, ТВ или стол-проектор с нулевыми сетевыми задержками и минимальным потреблением оперативной памяти.

---

## 📦 Платформенные релизы / Platform Downloads

Каждый релиз автоматически собирается в GitHub Actions со всеми готовыми пакетами:

| Платформа | Пакет релиза | Описание | Запуск |
| :--- | :--- | :--- | :--- |
| 🪟 **Windows** | `vtt-zero-v1.0.0-windows-portable.zip` | Портативная версия с `.bat` лаунчерами | Распаковать и запустить `start-dual-screen.bat` |
| 🍎 **macOS** | `vtt-zero-v1.0.0-macos-portable.zip` | Портативная версия с `.command` скриптами | Распаковать и запустить `start-dual-screen.command` |
| 🐧 **Linux** | `vtt-zero-v1.0.0-linux-portable.tar.gz` / `.zip` | Портативная версия с `.sh` и `.desktop` | Распаковать и запустить `./start-dual-screen.sh` |
| 🌐 **Universal** | `vtt-zero-v1.0.0-standalone.html` | Единый HTML файл (0 зависимостей) | Открыть в любом браузере (Chrome, Edge, Safari, Firefox) |
| 🖥️ **Web SPA** | `vtt-zero-v1.0.0-web-dist.zip` | Скомпилированный статический билд | Для Nginx, Apache, Caddy, Cloudflare Pages |

👉 **[Скачать последний релиз (GitHub Releases)](https://github.com/SvatOwl/vtt-zero-tabletop-projector/releases)**

---

## ⚡ Ключевые возможности

- **Двухоконная архитектура (DM View & Projector View)**:
  - Окно мастера (DM View) с полным контролем над картой, туманом, масштабом и сеткой.
  - Окно игроков (Player/Projector View) — чистый полноэкранный вьюпорт без управляющих кнопок.
- **Синхронизация с нулевой задержкой**:
  - Локальная синхронизация окон через нативный браузерный `BroadcastChannel API`.
  - Никаких сокетов, Node.js-серверов или задержек интернета.
- **Динамический туман войны (Fog of War)**:
  - Кисть открытия тумана (`Reveal [R]`) и кисть скрытия (`Hide [H]`) с настройкой радиуса (15–250 px).
  - Мгновенные действия: `Fill All` (скрыть всё) и `Clear All` (открыть всё).
  - Полупрозрачный предпросмотр скрытых зон (0.55 opacity) на экране мастера.
- **Аппаратное ускорение панорамирования и зума**:
  - Трансформация через аппаратный слой CSS3 (`translate3d` + `scale`).
  - Плавное приближение/отдаление (колесико мыши, кнопки зума, автомасштабирование `Fit`).
- **Поддержка любых форматов карт**:
  - Статические изображения: JPG, PNG, WebP, SVG.
  - Анимированные живые боевые карты: MP4, WebM (видео с аппаратным декодированием).
- **Тактическая сетка**:
  - Настраиваемый квадратный грид с регулировкой размера клетки (25px - 150px) и прозрачности.
- **Нулевые утечки памяти**:
  - Автоматическое освобождение ссылок `URL.revokeObjectURL()` при загрузке новых карт.
  - Идеально работает на старых ноутбуках (MacBook 2010+ с 2GB RAM, Intel Celeron, Raspberry Pi).

---

## 🚀 Быстрый старт (Quick Start)

### Вариант 1: Запуск готового пакета
1. Скачайте архив для вашей ОС со страницы **[Releases](https://github.com/SvatOwl/vtt-zero-tabletop-projector/releases)**.
2. Распакуйте архив в любую папку.
3. Запустите лаунчер двух экранов:
   - **Windows**: Двойной клик на `start-dual-screen.bat`
   - **macOS**: Двойной клик на `start-dual-screen.command`
   - **Linux**: Запустите `./start-dual-screen.sh`
4. Перетащите окно игроков на второй экран/проектор и нажмите **F11** для перехода в полный экран.
5. На экране мастера перетащите файл карты (Drag-and-Drop) в рабочую область.

### Вариант 2: Запуск единого HTML файла
Просто скачайте `vtt-zero-standalone.html` и откройте его в браузере. Нажмите кнопку **"OPEN PROJECTOR"** в верхней панели мастера — откроется второе окно для проектора.

---

## ⌨️ Горячие клавиши (Hotkeys)

| Клавиша / Сочетание | Действие |
| :--- | :--- |
| `R` | Включить кисть открытия тумана войны (*Reveal*) |
| `H` | Включить кисть скрытия тумана войны (*Hide*) |
| `Space` + Drag / Средняя кнопка | Панорамирование карты (*Pan*) |
| `Колесико мыши` | Плавный зум в точку курсора |
| `+` / `-` | Увеличить / Уменьшить масштаб |
| `F11` | Полноэкранный режим в окне проектора |

---

## 🛠️ Разработка и локальная сборка

### Требования
- Node.js 18+ (или 20+)
- npm 9+

```bash
# Клонирование репозитория
git clone https://github.com/SvatOwl/vtt-zero-tabletop-projector.git
cd vtt-zero-tabletop-projector

# Установка зависимостей
npm install

# Запуск dev-сервера на порту 3000
npm run dev

# Проверка типов и линтинг
npm run lint

# Сборка статического веб-клиента (dist)
npm run build

# Генерация и сборка всех платформенных релизов (Windows, Mac, Linux, Web)
npm run package:release
```

После выполнения `npm run package:release` все архивы и `SHA256SUMS.txt` будут сгенерированы в папке `release-artifacts/`.

---

## 🤖 Настройка автоматизации релизов (GitHub Actions)

В репозитории настроены три автоматизированных CI/CD воркфлоу:

1. **`.github/workflows/release.yml`** — Автоматическая публикация релиза:
   - Срабатывает при создании и отправке тега версии:
     ```bash
     git tag v1.0.0
     git push origin v1.0.0
     ```
   - Либо запускается вручную через вкладку **Actions -> Release Packages -> Run workflow** с указанием версии (например `v1.0.1`).
   - Собирает все платформенные архивы (Windows, Mac, Linux, Standalone HTML, Web Dist), вычисляет SHA256 суммы и прикрепляет их к релизу на GitHub.

2. **`.github/workflows/pages.yml`** — Автоматический деплой на GitHub Pages:
   - При каждом пуше в ветку `main` собирает SPA и публикует на GitHub Pages (доступно онлайн по адресу `https://<username>.github.io/<repo>/`).
   - *Важно (первоначальная настройка на GitHub)*: В настройках репозитория перейдите в **Settings** ➔ **Pages** ➔ в блоке **Build and deployment** выберите **Source: GitHub Actions**.

3. **`.github/workflows/ci.yml`** — Проверка целостности кода:
   - Проверяет TypeScript компиляцию, линтинг и сборку при каждом Pull Request и Push.

---

## 🐳 Self-Hosting через Docker

Для запуска собственного веб-сервера на домашнем сервере или Raspberry Pi:

```bash
# Запуск через Docker Compose
docker compose up -d --build

# Доступ к приложению:
# http://localhost:8080 (или IP вашего сервера)
```

Размер итогового контейнера на базе Alpine Nginx составляет всего ~15 МБ.

---

## 🔒 Безопасность и проверка целостности

Все релизные файлы снабжены файлом `SHA256SUMS.txt`. Вы можете проверить контрольные суммы:

```bash
# Linux
sha256sum -c SHA256SUMS.txt

# macOS
shasum -a 256 -c SHA256SUMS.txt

# Windows (PowerShell)
Get-FileHash vtt-zero-v1.0.0-windows-portable.zip -Algorithm SHA256
```

---

## 📄 Лицензия

Распространяется под свободной лицензией **MIT**. Подробности в файле [LICENSE](LICENSE).
