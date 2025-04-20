import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, ProgressBar, useTheme, RadioButton } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { storage } from '../../services/storage';

type ReadinessAssessmentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Assessment questions based on the Transtheoretical Model
const ASSESSMENT_QUESTIONS = [
  {
    id: 'q1',
    text: 'I don\'t think my drinking is a problem.',
    stage: 'pre-contemplation',
  },
  {
    id: 'q2',
    text: 'I have been thinking about cutting down on my drinking.',
    stage: 'contemplation',
  },
  {
    id: 'q3',
    text: 'I have made small changes to my drinking habits in the past 6 months.',
    stage: 'preparation',
  },
  {
    id: 'q4',
    text: 'I have been actively working on reducing my drinking for less than 6 months.',
    stage: 'action',
  },
  {
    id: 'q5',
    text: 'I have been maintaining reduced drinking for more than 6 months.',
    stage: 'maintenance',
  },
  {
    id: 'q6',
    text: 'I feel confident in my ability to control my drinking.',
    stage: 'action',
  },
  {
    id: 'q7',
    text: 'I have experienced negative consequences from my drinking.',
    stage: 'contemplation',
  },
  {
    id: 'q8',
    text: 'I have a plan for how I will reduce my drinking.',
    stage: 'preparation',
  },
  {
    id: 'q9',
    text: 'I have told others about my intention to change my drinking habits.',
    stage: 'action',
  },
  {
    id: 'q10',
    text: 'I have identified triggers that lead me to drink more than intended.',
    stage: 'preparation',
  },
];

export const ReadinessAssessmentScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<ReadinessAssessmentScreenNavigationProp>();
  const { currentUser, readinessAssessment, setIsAuthenticated } = useApp();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Calculate progress
  const progress = (currentQuestionIndex + 1) / ASSESSMENT_QUESTIONS.length;

  // Determine stage based on answers
  const determineStage = (): 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance' => {
    // Count answers for each stage
    const stageCounts: Record<string, number> = {
      'pre-contemplation': 0,
      'contemplation': 0,
      'preparation': 0,
      'action': 0,
      'maintenance': 0,
    };

    // Sum up the scores for each stage
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = ASSESSMENT_QUESTIONS.find(q => q.id === questionId);
      if (question) {
        stageCounts[question.stage] += answer;
      }
    });

    // Find the stage with the highest score
    let maxStage = 'pre-contemplation';
    let maxScore = stageCounts['pre-contemplation'];

    Object.entries(stageCounts).forEach(([stage, score]) => {
      if (score > maxScore) {
        maxScore = score;
        maxStage = stage;
      }
    });

    return maxStage as 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
  };

  // Calculate total score
  const calculateScore = (): number => {
    const totalAnswers = Object.values(answers).reduce((sum, value) => sum + value, 0);
    const maxPossibleScore = ASSESSMENT_QUESTIONS.length * 5; // 5 is the highest answer value
    return Math.round((totalAnswers / maxPossibleScore) * 100);
  };

  const handleAnswer = (value: number) => {
    const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < ASSESSMENT_QUESTIONS.length) {
      Alert.alert('Incomplete Assessment', 'Please answer all questions before submitting.');
      return;
    }

    setLoading(true);
    try {
      const stage = determineStage();
      const score = calculateScore();
      
      // Format answers for storage
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      // Save assessment using the storage service
      await storage.readinessAssessment.add({
        userId: currentUser?.id || '',
        stage,
        score,
        answers: formattedAnswers,
      });

      // Set isAuthenticated to true after assessment is completed
      setIsAuthenticated(true);

      // Navigate to the main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
      Alert.alert('Error', 'Failed to save your assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Readiness Assessment
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Question {currentQuestionIndex + 1} of {ASSESSMENT_QUESTIONS.length}
        </Text>
        <ProgressBar progress={progress} style={styles.progressBar} />
      </View>

      <ScrollView style={styles.content}>
        <Text variant="titleLarge" style={styles.question}>
          {currentQuestion.text}
        </Text>

        <RadioButton.Group
          onValueChange={value => handleAnswer(parseInt(value))}
          value={answers[currentQuestion.id]?.toString() || ''}
        >
          <View style={styles.optionsContainer}>
            <RadioButton.Item
              label="Strongly Disagree"
              value="1"
              position="leading"
              labelStyle={styles.radioLabel}
            />
            <RadioButton.Item
              label="Disagree"
              value="2"
              position="leading"
              labelStyle={styles.radioLabel}
            />
            <RadioButton.Item
              label="Neutral"
              value="3"
              position="leading"
              labelStyle={styles.radioLabel}
            />
            <RadioButton.Item
              label="Agree"
              value="4"
              position="leading"
              labelStyle={styles.radioLabel}
            />
            <RadioButton.Item
              label="Strongly Agree"
              value="5"
              position="leading"
              labelStyle={styles.radioLabel}
            />
          </View>
        </RadioButton.Group>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handleBack}
          disabled={currentQuestionIndex === 0 || loading}
          style={styles.button}
        >
          Back
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!answers[currentQuestion.id] || loading}
          loading={loading && currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1}
          style={styles.button}
        >
          {currentQuestionIndex === ASSESSMENT_QUESTIONS.length - 1 ? 'Submit' : 'Next'}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  question: {
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  radioLabel: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
}); 