# questionnaires/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.QuestionnaireListView.as_view(), name='questionnaire-list'),
    path('<int:pk>/', views.QuestionnaireDetailView.as_view(), name='questionnaire-detail'),
    path('<int:questionnaire_id>/submit/', views.SubmitQuestionnaireView.as_view(), name='submit-questionnaire'),
    path('my-answers/', views.UserAnswersListView.as_view(), name='user-answers'),
]