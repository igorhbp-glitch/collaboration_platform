# check_news_media.py
import os
import django
import json
from pprint import pprint

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'collaboration_platform.settings')
django.setup()

from conferences.models import EventNews


def check_news_media():
    print("\n" + "=" * 80)
    print("🔍 ПРОВЕРКА МЕДИА В НОВОСТЯХ")
    print("=" * 80)

    # Проверим конкретно новость ID=7
    try:
        news = EventNews.objects.get(id=7)
        print(f"\n📰 Новость ID=7: {news.title}")
        print(f"   Тип поля media: {type(news.media)}")
        print(f"   Содержимое media:")
        pprint(news.media)

        if news.media:
            print(f"\n📊 Детальный разбор:")
            for i, item in enumerate(news.media):
                print(f"\n   Медиа #{i + 1}:")
                print(f"      ID: {item.get('id')}")
                print(f"      Тип: {item.get('type')}")
                print(f"      URL: {item.get('url')}")
                print(f"      Имя: {item.get('name', item.get('filename'))}")
                print(f"      Размер: {item.get('size')} байт")

                # Проверяем существование файла
                if item.get('url'):
                    from django.conf import settings
                    url = item['url']
                    # Извлекаем путь из URL
                    if url.startswith('http'):
                        file_path = url.split('/media/')[-1]
                        file_path = 'media/' + file_path
                    else:
                        file_path = url.replace(settings.MEDIA_URL, '')

                    full_path = os.path.join(settings.MEDIA_ROOT, file_path.replace('media/', ''))
                    exists = os.path.exists(full_path)
                    print(f"      Файл на диске: {'✅' if exists else '❌'} {full_path}")

                    if not exists:
                        # Ищем похожие файлы
                        dir_path = os.path.dirname(full_path)
                        if os.path.exists(dir_path):
                            files = os.listdir(dir_path)
                            mov_files = [f for f in files if f.endswith('.mov')]
                            print(f"      Доступные .mov файлы: {mov_files}")
        else:
            print("   ❌ media пусто")

    except EventNews.DoesNotExist:
        print("❌ Новость с ID=7 не найдена")


if __name__ == "__main__":
    check_news_media()