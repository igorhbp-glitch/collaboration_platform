from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/questionnaires/', include('questionnaires.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/conferences/', include('conferences.urls')),  # 🔥 ДОБАВИТЬ ЭТУ СТРОКУ
    path('api/invitations/', include('invitations.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('auth/', include('social_django.urls', namespace='social')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    # Дополнительное логирование для отладки
    print(f"\n🔥 Media files will be served from: {settings.MEDIA_ROOT}")
    print(f"🔥 Media URL: {settings.MEDIA_URL}\n")