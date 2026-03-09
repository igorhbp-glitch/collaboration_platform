# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import vk_sdk_views

urlpatterns = [
    # ============================================
    # АУТЕНТИФИКАЦИЯ
    # ============================================
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('current-user/', views.current_user, name='current-user'),

    # ============================================
    # 🔥 ЭНДПОИНТ ДЛЯ ПОЛНОГО ОБНОВЛЕНИЯ ПРОФИЛЯ
    # ============================================
    path('profile/update/', views.update_full_profile, name='update-full-profile'),

    # ============================================
    # ПОИСК ПОЛЬЗОВАТЕЛЕЙ
    # ============================================
    path('find-by-email/', views.find_user_by_email, name='find-user-by-email'),
    path('search/', views.search_users, name='search-users'),
    path('list/', views.list_users, name='user-list'),
    path('users/<int:user_id>/', views.get_user_by_id, name='get-user-by-id'),

    # ============================================
    # СПРАВОЧНИКИ (ДЛЯ АНКЕТЫ)
    # ============================================
    path('branches/', views.BranchListView.as_view(), name='branches'),
    path('study-programs/', views.StudyProgramListView.as_view(), name='study-programs'),
    path('departments/', views.DepartmentListView.as_view(), name='departments'),
    path('research-fields/', views.ResearchFieldListView.as_view(), name='research-fields'),
    path('methodologies/', views.MethodologyListView.as_view(), name='methodologies'),
    path('competencies/', views.CompetencyListView.as_view(), name='competencies'),
    path('collaboration-types/', views.CollaborationTypeListView.as_view(), name='collaboration-types'),
    path('publication-types/', views.PublicationTypeListView.as_view(), name='publication-types'),

    # ============================================
    # ПОЛУЧЕНИЕ ВСЕХ ДАННЫХ ДЛЯ АНКЕТЫ
    # ============================================
    path('questionnaire-data/', views.get_questionnaire_data, name='questionnaire-data'),

    # ============================================
    # VK АВТОРИЗАЦИЯ
    # ============================================
    path('vk-exchange/', vk_sdk_views.vk_exchange_code, name='vk-exchange'),

    # ============================================
    # HEALTH CHECK (для тестирования)
    # ============================================
    path('health/', views.health_check, name='health'),
    path('upload-avatar/', views.upload_avatar, name='upload-avatar'),
    path('delete-avatar/', views.delete_avatar, name='delete-avatar'),
]