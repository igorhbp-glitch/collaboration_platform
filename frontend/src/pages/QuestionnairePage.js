// src/pages/QuestionnairePage.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  Slider,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { questionnairesAPI } from '../services/api';

const QuestionnairePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestionnaire();
  }, [id]);

  const loadQuestionnaire = async () => {
    try {
      const data = await questionnairesAPI.getQuestionnaire(id);
      setQuestionnaire(data);

      // Инициализируем пустые ответы
      const initialAnswers = {};
      data.questions.forEach(q => {
        if (q.question_type === 'multiple_choice') {
          initialAnswers[q.id] = [];
        } else if (q.question_type === 'scale') {
          initialAnswers[q.id] = 3; // среднее значение по умолчанию
        } else {
          initialAnswers[q.id] = '';
        }
      });
      setAnswers(initialAnswers);

    } catch (err) {
      setError('Ошибка загрузки анкеты');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultipleChoiceChange = (questionId, option, checked) => {
    setAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...currentAnswers, option] };
      } else {
        return { ...prev, [questionId]: currentAnswers.filter(item => item !== option) };
      }
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Формируем ответы в нужном формате
      const formattedAnswers = Object.entries(answers).map(([questionId, answerData]) => ({
        question_id: parseInt(questionId),
        answer_data: answerData
      }));

      await questionnairesAPI.submitQuestionnaire(id, formattedAnswers);

      alert('Анкета успешно заполнена!');
      navigate('/dashboard');

    } catch (err) {
      console.error('Submission error:', err);
      alert('Ошибка при отправке анкеты');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const currentAnswer = answers[question.id];

    switch (question.question_type) {
      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Введите ваш ответ..."
          />
        );

      case 'single_choice':
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              {question.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'multiple_choice':
        return (
          <FormControl component="fieldset">
            <FormGroup>
              {question.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={(currentAnswer || []).includes(option)}
                      onChange={(e) =>
                        handleMultipleChoiceChange(question.id, option, e.target.checked)
                      }
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
          </FormControl>
        );

      case 'scale':
        return (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Typography gutterBottom>
              Выберите значение от 1 до 5
            </Typography>
            <Slider
              value={currentAnswer || 3}
              onChange={(e, value) => handleAnswerChange(question.id, value)}
              min={1}
              max={5}
              step={1}
              marks={[
                { value: 1, label: '1' },
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' }
              ]}
              valueLabelDisplay="auto"
            />
            <Typography variant="body2" color="textSecondary" align="center">
              Текущее значение: {currentAnswer || 3}
            </Typography>
          </Box>
        );

      default:
        return <Typography color="error">Неизвестный тип вопроса</Typography>;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Загрузка анкеты...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/dashboard')}>
          Вернуться на Dashboard
        </Button>
      </Container>
    );
  }

  const currentQuestion = questionnaire?.questions[activeStep];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Шаги */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {questionnaire.questions.map((question, index) => (
            <Step key={question.id}>
              <StepLabel>Вопрос {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Заголовок анкеты */}
        <Typography variant="h4" gutterBottom>
          {questionnaire.title}
        </Typography>
        <Typography color="textSecondary" paragraph>
          {questionnaire.description}
        </Typography>

        {/* Текущий вопрос */}
        {currentQuestion && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              {activeStep + 1}. {currentQuestion.text}
              {currentQuestion.is_required && (
                <Typography component="span" color="error"> *</Typography>
              )}
            </Typography>

            {renderQuestion(currentQuestion)}

            {/* Кнопки навигации */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Назад
              </Button>

              {activeStep < questionnaire.questions.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Следующий вопрос
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Завершить анкету'}
                </Button>
              )}
            </Box>

            {/* Прогресс */}
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
              Вопрос {activeStep + 1} из {questionnaire.questions.length}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default QuestionnairePage;