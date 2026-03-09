# questionnaires/serializers.py
from rest_framework import serializers
from .models import Questionnaire, Question, Answer


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'text', 'question_type', 'order',
            'is_required', 'options'
        ]


class QuestionnaireListSerializer(serializers.ModelSerializer):
    questions_count = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Questionnaire
        fields = [
            'id', 'title', 'description', 'status',
            'target_audience', 'created_by_name', 'questions_count',
            'created_at'
        ]

    def get_questions_count(self, obj):
        return obj.questions.count()


class QuestionnaireDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Questionnaire
        fields = [
            'id', 'title', 'description', 'status',
            'target_audience', 'created_by', 'created_by_name',
            'questions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by']


class AnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    questionnaire_title = serializers.CharField(source='question.questionnaire.title', read_only=True)

    class Meta:
        model = Answer
        fields = [
            'id', 'question', 'question_text', 'questionnaire_title',
            'answer_data', 'answered_at'
        ]
        read_only_fields = ['respondent', 'answered_at']


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    answer_data = serializers.JSONField()

    def validate_question_id(self, value):
        try:
            Question.objects.get(id=value)
        except Question.DoesNotExist:
            raise serializers.ValidationError("Вопрос не найден")
        return value


class SubmitQuestionnaireSerializer(serializers.Serializer):
    answers = SubmitAnswerSerializer(many=True)

    def validate(self, data):
        if not data.get('answers'):
            raise serializers.ValidationError("Необходимо предоставить ответы")
        return data