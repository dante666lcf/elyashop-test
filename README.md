# ElyaShop — Vercel test version

Готовый статический сайт для пустого GitHub-репозитория.

## Как залить

Содержимое этой папки положите В КОРЕНЬ репозитория:

    index.html
    styles.css
    app.js
    vercel.json
    data/
    build_catalog.py

Сделайте commit и push. Vercel должен автоматически задеплоить проект.

Никаких npm install / build command не требуется.

## Фотографии

Фотографии НЕ лежат в репозитории и НЕ хранятся в Vercel.

В JSON сохраняются исходные URL вида:

    https://xcimg.szwego.com/...

На странице каталога:
- загружается только первое изображение видимых карточек;
- изображения ниже экрана подгружаются lazy-load;
- остальные фото товара загружаются только после открытия карточки.

## Почему каталог разбит

Исходный catalog.json весит около 13 MB.

Для сайта он разбит на:
- data/index.json — компактный индекс для каталога/поиска;
- data/chunks/*.json — полные данные блоками по 100 товаров.

Полный chunk загружается только когда пользователь открывает товар.

## Когда будет готов catalog_ru.json

Положите `catalog_ru.json` рядом с `build_catalog.py` и выполните:

    python build_catalog.py catalog_ru.json

После этого commit + push.

Сайт автоматически получит русские title, а структура и фотографии останутся прежними.

## Vercel

Framework Preset:
    Other

Build Command:
    оставить пустым

Output Directory:
    оставить пустым

Root Directory:
    ./

После push Vercel выдаст публичный URL.
