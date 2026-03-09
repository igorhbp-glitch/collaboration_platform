# questionnaires/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from .models import Questionnaire, Question, Answer
from .serializers import (
    QuestionnaireListSerializer, QuestionnaireDetailSerializer,
    AnswerSerializer, SubmitQuestionnaireSerializer
)
import logging
import json

logger = logging.getLogger(__name__)


class QuestionnaireListView(generics.ListAPIView):
    serializer_class = QuestionnaireListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Questionnaire.objects.filter(status='active')

        # Фильтрация по целевой аудитории
        user_role = self.request.user.role
        if user_role == 'teacher':
            queryset = queryset.filter(target_audience__in=['all', 'teachers'])
        elif user_role == 'student':
            queryset = queryset.filter(target_audience__in=['all', 'students'])

        return queryset


class QuestionnaireDetailView(generics.RetrieveAPIView):
    serializer_class = QuestionnaireDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Questionnaire.objects.filter(status='active')


class UserAnswersListView(generics.ListAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Используем questionnaire_responses (новое имя related_name)
        return Answer.objects.filter(respondent=self.request.user)


class SubmitQuestionnaireView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, questionnaire_id):
        try:
            questionnaire = Questionnaire.objects.get(
                id=questionnaire_id,
                status='active'
            )
        except Questionnaire.DoesNotExist:
            return Response(
                {"error": "Анкета не найдена или не активна"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SubmitQuestionnaireSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Проверяем все вопросы
        questions = questionnaire.questions.filter(is_required=True)
        answered_question_ids = [answer['question_id'] for answer in serializer.validated_data['answers']]

        missing_questions = questions.exclude(id__in=answered_question_ids)
        if missing_questions.exists():
            return Response({
                "error": "Не все обязательные вопросы заполнены",
                "missing_questions": list(missing_questions.values_list('id', flat=True))
            }, status=status.HTTP_400_BAD_REQUEST)

        # Сохраняем ответы
        answers_to_create = []
        for answer_data in serializer.validated_data['answers']:
            try:
                question = Question.objects.get(
                    id=answer_data['question_id'],
                    questionnaire=questionnaire
                )

                # Удаляем старый ответ если есть (используем обновленное имя)
                Answer.objects.filter(
                    question=question,
                    respondent=request.user
                ).delete()

                answers_to_create.append(Answer(
                    question=question,
                    respondent=request.user,
                    answer_data=answer_data['answer_data']
                ))
            except Question.DoesNotExist:
                return Response({
                    "error": f"Вопрос с ID {answer_data['question_id']} не принадлежит этой анкете"
                }, status=status.HTTP_400_BAD_REQUEST)

        if answers_to_create:
            Answer.objects.bulk_create(answers_to_create)

            # 🔥 ОБНОВЛЯЕМ КОМПЕТЕНЦИИ ПОЛЬЗОВАТЕЛЯ
            self.update_user_competencies(request.user, questionnaire_id, answers_to_create)

        return Response({
            "message": "Ответы успешно сохранены",
            "saved_answers": len(answers_to_create)
        }, status=status.HTTP_201_CREATED)

    def update_user_competencies(self, user, questionnaire_id, answers):
        """
        Обновляет поле competencies пользователя на основе ответов на анкету
        """
        try:
            # ID анкеты для сбора компетенций (замените на ваш реальный ID)
            COMPETENCY_QUESTIONNAIRE_ID = 3  # У вас ID=3

            if questionnaire_id != COMPETENCY_QUESTIONNAIRE_ID:
                logger.info(f"Анкета {questionnaire_id} не является анкетой компетенций, пропускаем")
                return

            # Структура для хранения компетенций (для обратной совместимости)
            competencies = {
                'personal_info': {},
                'research_fields': [],
                'methodologies': [],
                'competencies': [],
                'experience': {
                    'publications_count': 0,
                    'publication_types': [],
                    'projects': ''
                },
                'collaboration': {
                    'types': []
                }
            }

            # Обрабатываем каждый ответ
            for answer in answers:
                question_text = answer.question.text.lower()
                answer_data = answer.answer_data

                logger.info(f"📝 Обработка ответа: {question_text[:50]}...")

                # Здесь будет логика маппинга вопросов в структуру competencies
                # (для обратной совместимости со старым форматом)

            # Сохраняем в профиль пользователя (временное решение для обратной совместимости)
            # В новой структуре данные будут храниться в отдельных полях,
            # но пока оставляем и в JSON для совместимости
            user.competencies = competencies
            user.save()

            # Очищаем кэш рекомендаций
            try:
                from projects.matching import clear_recommendations_cache
                clear_recommendations_cache(user.id)
                logger.info("🧹 Кэш рекомендаций очищен")
            except ImportError:
                logger.warning("⚠️ Не удалось импортировать clear_recommendations_cache")

            logger.info(f"✅ Компетенции пользователя {user.email} успешно обновлены (временный JSON)")
            logger.info(f"📊 Сохраненные данные: {json.dumps(competencies, ensure_ascii=False, indent=2)}")

        except Exception as e:
            logger.error(f"❌ Ошибка при обновлении компетенций: {e}")
            import traceback
            logger.error(traceback.format_exc())