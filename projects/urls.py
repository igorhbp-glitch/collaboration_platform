# projects/urls.py - ПОЛНАЯ ВЕРСИЯ С НОВЫМИ МАРШРУТАМИ ЧАТА
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .task_views import TaskViewSet
from .comment_views import CommentViewSet
from . import upload_views
from . import chat_views
from . import sprint_views
from . import jitsi_views
from . import document_views
from .views import ProjectViewSet

# Создаем роутеры
project_router = DefaultRouter()
project_router.register(r'', views.ProjectViewSet, basename='project')

# Маршруты для задач
task_router = DefaultRouter()
task_router.register(r'', TaskViewSet, basename='task')

urlpatterns = [
    # ========================
    # МАРШРУТЫ ДЛЯ ЗАДАЧ
    # ========================
    path('tasks/', include(task_router.urls)),

    # ========================
    # МАРШРУТЫ ДЛЯ КОММЕНТАРИЕВ К ЗАДАЧАМ
    # ========================
    path('tasks/<int:task_id>/comments/',
         CommentViewSet.as_view({
             'get': 'list',
             'post': 'create'
         }), name='task-comments-list'),
    path('tasks/<int:task_id>/comments/<int:pk>/',
         CommentViewSet.as_view({
             'get': 'retrieve',
             'put': 'update',
             'patch': 'partial_update',
             'delete': 'destroy'
         }), name='task-comments-detail'),
    path('tasks/<int:task_id>/comments/<int:pk>/replies/',
         CommentViewSet.as_view({
             'get': 'replies'
         }), name='task-comment-replies'),
    path('tasks/<int:task_id>/comments/my_comments/',
         CommentViewSet.as_view({
             'get': 'my_comments'
         }), name='task-comments-my'),
    path('tasks/<int:task_id>/comments/count/',
         CommentViewSet.as_view({
             'get': 'count'
         }), name='task-comments-count'),

    # ========================
    # МАРШРУТЫ ДЛЯ СПРИНТОВ
    # ========================
    path('<int:project_id>/sprints/',
         sprint_views.ProjectSprintListView.as_view(),
         name='project-sprints'),
    path('<int:project_id>/sprints/create/',
         sprint_views.ProjectSprintCreateView.as_view(),
         name='project-sprint-create'),
    path('sprints/<int:pk>/',
         sprint_views.SprintDetailView.as_view(),
         name='sprint-detail'),
    path('sprints/<int:pk>/start/',
         sprint_views.SprintStartView.as_view(),
         name='sprint-start'),
    path('sprints/<int:pk>/complete/',
         sprint_views.SprintCompleteView.as_view(),
         name='sprint-complete'),
    path('sprints/<int:pk>/tasks/',
         sprint_views.SprintTasksView.as_view(),
         name='sprint-tasks'),
    path('sprints/<int:pk>/stats/',
         sprint_views.SprintStatsView.as_view(),
         name='sprint-stats'),
    path('<int:project_id>/sprints/',
         sprint_views.ProjectSprintCreateView.as_view(),
         name='project-sprint-create-alt'),

    # ========================
    # 🔥 МАРШРУТЫ ДЛЯ ЧАТА ПРОЕКТА (ВСЕ СТАРЫЕ СОХРАНЕНЫ)
    # ========================

    # СТАРЫЕ МАРШРУТЫ (для обратной совместимости)
    path('<int:project_id>/chat/',
         chat_views.ProjectChatMessageListCreateView.as_view(),
         name='project-chat-list'),
    path('<int:project_id>/chat/<int:message_id>/',
         chat_views.ProjectChatMessageDetailView.as_view(),
         name='project-chat-detail'),
    path('<int:project_id>/chat/<int:message_id>/mark_read/',
         chat_views.ProjectChatMessageMarkReadView.as_view(),
         name='project-chat-mark-read'),
    path('<int:project_id>/chat/unread_count/',
         chat_views.project_chat_unread_count,
         name='project-chat-unread-count'),
    path('<int:project_id>/chat/history/',
         chat_views.project_chat_history,
         name='project-chat-history'),
    path('<int:project_id>/chat/search/',
         chat_views.project_chat_search,
         name='project-chat-search'),

    # 🔥 НОВЫЕ МАРШРУТЫ (для пагинации и статистики)
    path('<int:project_id>/chat/messages/',
         chat_views.project_chat_messages_paginated,
         name='project-chat-messages-paginated'),
    path('<int:project_id>/chat/stats/',
         chat_views.project_chat_stats,
         name='project-chat-stats'),

    # ========================
    # ЗАГРУЗКА ФАЙЛОВ
    # ========================
    path('upload/', upload_views.upload_file, name='upload-file'),
    path('delete-file/', upload_views.delete_file, name='delete-file'),
    path('file-info/', upload_views.get_file_info, name='file-info'),

    # ========================
    # МАРШРУТЫ ДЛЯ ПРОЕКТОВ
    # ========================
    path('', include(project_router.urls)),

    # ========================
    # СПЕЦИАЛЬНЫЕ МАРШРУТЫ
    # ========================
    path('my/', views.ProjectViewSet.as_view({'get': 'my'}), name='my-projects'),
    path('owned/', views.ProjectViewSet.as_view({'get': 'owned'}), name='owned-projects'),
    path('<int:project_id>/members/', views.project_members, name='project-members'),

    # ========================
    # РЕКОМЕНДАЦИИ И ПРИГЛАШЕНИЯ
    # ========================
    path('recommendations/users/', views.user_recommendations, name='user_recommendations'),
    path('simple-recommendations/', views.simple_user_recommendations, name='simple_recommendations'),
    path('test-recommendations/', views.test_recommendations, name='test_recommendations'),
    path('recommendations/projects/', views.ProjectRecommendationsView.as_view(), name='project_recommendations'),
    path('invitations/send/', views.SendInvitationView.as_view(), name='send_invitation'),
    path('invitations/my/', views.UserInvitationsView.as_view(), name='my_invitations'),
    path('system-status/', views.system_status, name='system_status'),

    # ========================
    # МАРШРУТЫ ДЛЯ КОНФЕРЕНЦИЙ (Jitsi)
    # ========================
    path('<int:project_id>/save-conference-link/',
         jitsi_views.save_conference_link,
         name='save-conference-link'),
    path('<int:project_id>/clear-conference-link/',
         jitsi_views.clear_conference_link,
         name='clear-conference-link'),

    # ========================
    # МАРШРУТЫ ДЛЯ ДОКУМЕНТОВ ПРОЕКТА
    # ========================
    path('<int:project_id>/documents/',
         document_views.ProjectDocumentListView.as_view(),
         name='project-documents'),
    path('documents/<int:pk>/',
         document_views.ProjectDocumentDetailView.as_view(),
         name='project-document-detail'),

    # ========================
    # ЗАЯВКИ НА УЧАСТИЕ В ПРОЕКТЕ
    # ========================
    path('<int:project_id>/request-join/',
         ProjectViewSet.as_view({'post': 'request_join'}),
         name='project-request-join'),
    path('<int:project_id>/membership-requests/',
         ProjectViewSet.as_view({'get': 'membership_requests'}),
         name='project-membership-requests'),
    path('<int:project_id>/members/<int:member_id>/approve/',
         ProjectViewSet.as_view({'post': 'approve_member'}),
         name='project-member-approve'),
    path('<int:project_id>/members/<int:member_id>/reject/',
         ProjectViewSet.as_view({'post': 'reject_member'}),
         name='project-member-reject'),
    path('<int:project_id>/members/<int:member_id>/cancel/',
         ProjectViewSet.as_view({'post': 'cancel_request'}),
         name='project-cancel-request'),
    path('<int:project_id>/members/<int:member_id>/update-role/',
         ProjectViewSet.as_view({'post': 'update_member_role'}),
         name='project-update-member-role'),
]