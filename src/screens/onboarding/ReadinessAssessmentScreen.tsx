import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, ProgressBar, useTheme, RadioButton } from 'react-native-paper';
import { useApp } from '../../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { storage, STORAGE_KEYS } from '../../services/storage';

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

  // Define weights for each question
  const questionWeights: Record<string, number> = {
    q1: 1.5,  // Strong indicator of pre-contemplation
    q2: 1.2,  // Strong indicator of contemplation
    q3: 1.0,  // Standard weight
    q4: 1.3,  // Strong indicator of action
    q5: 1.4,  // Strong indicator of maintenance
    q6: 0.8,  // Less reliable indicator of action
    q7: 1.1,  // Good indicator of contemplation
    q8: 1.2,  // Good indicator of preparation
    q9: 0.9,  // Moderate indicator of action
    q10: 1.1, // Good indicator of preparation
  };

  const determineReadinessProfile = () => {
    // Count weighted answers for each stage
    const stageScores: Record<string, number> = {
      'pre-contemplation': 0,
      'contemplation': 0,
      'preparation': 0,
      'action': 0,
      'maintenance': 0,
    };

    // Calculate weighted scores
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = ASSESSMENT_QUESTIONS.find(q => q.id === questionId);
      if (question) {
        const weight = questionWeights[questionId] || 1.0;
        
        // For pre-contemplation questions, reverse the scoring
        const adjustedAnswer = question.stage === 'pre-contemplation' 
          ? 6 - answer 
          : answer;
          
        stageScores[question.stage] += adjustedAnswer * weight;
      }
    });

    // Calculate maximum possible scores for each stage
    const maxScores: Record<string, number> = {};
    Object.keys(stageScores).forEach(stage => {
      const stageQuestions = ASSESSMENT_QUESTIONS.filter(q => q.stage === stage);
      maxScores[stage] = stageQuestions.reduce((sum, q) => {
        return sum + (5 * (questionWeights[q.id] || 1.0));
      }, 0);
    });
    
    // Calculate percentage scores for each stage
    const stagePercentages: Record<string, number> = {};
    Object.keys(stageScores).forEach(stage => {
      stagePercentages[stage] = maxScores[stage] > 0 
        ? (stageScores[stage] / maxScores[stage]) * 100 
        : 0;
    });

    // Determine primary and secondary stages
    let primaryStage: 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance' = 'pre-contemplation';
    let primaryScore = stagePercentages['pre-contemplation'];
    let secondaryStage: ('pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance') | null = null;
    let secondaryScore = 0;

    Object.entries(stagePercentages).forEach(([stage, score]) => {
      if (score > primaryScore) {
        secondaryStage = primaryStage;
        secondaryScore = primaryScore;
        primaryStage = stage as 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
        primaryScore = score;
      } else if (score > secondaryScore && stage !== primaryStage) {
        secondaryStage = stage as 'pre-contemplation' | 'contemplation' | 'preparation' | 'action' | 'maintenance';
        secondaryScore = score;
      }
    });

    // Calculate overall readiness score
    const stageWeights = {
      'pre-contemplation': 1,
      'contemplation': 2,
      'preparation': 3,
      'action': 4,
      'maintenance': 5,
    };
    
    const readinessScore = Object.entries(stagePercentages).reduce((score, [stage, percentage]) => {
      return score + (percentage * stageWeights[stage as keyof typeof stageWeights]);
    }, 0) / (100 * Object.keys(stageWeights).length);
    
    // Scale to 0-100
    const scaledReadinessScore = Math.round((readinessScore / 5) * 100);
    
    // Calculate confidence level
    const confidenceGap = primaryScore - (secondaryScore || 0);
    const confidenceLevel = Math.min(100, Math.round(confidenceGap * 1.5));
    
    // Create stage levels object
    const stageLevels: Record<string, { score: number; percentage: number }> = {};
    Object.entries(stageScores).forEach(([stage, score]) => {
      stageLevels[stage] = {
        score,
        percentage: stagePercentages[stage]
      };
    });
    
    // Generate recommendations
    const recommendations = generateRecommendations(primaryStage, secondaryStage, scaledReadinessScore, stageLevels);
    
    return {
      primaryStage,
      secondaryStage,
      readinessScore: scaledReadinessScore,
      confidenceLevel,
      stageLevels,
      recommendations
    };
  };

  const generateRecommendations = (
    primaryStage: string, 
    secondaryStage: string | null, 
    readinessScore: number,
    stageLevels: Record<string, { score: number; percentage: number }>
  ): string[] => {
    const recommendations: string[] = [];
    
    // Base recommendations on primary stage
    switch (primaryStage) {
      case 'pre-contemplation':
        recommendations.push('Focus on raising awareness about your drinking patterns');
        recommendations.push('Track your drinking to identify patterns without pressure to change');
        break;
      case 'contemplation':
        recommendations.push('Consider the pros and cons of changing your drinking habits');
        recommendations.push('Set small goals to build confidence in your ability to change');
        break;
      case 'preparation':
        recommendations.push('Create a specific plan for reducing your drinking');
        recommendations.push('Identify triggers and develop strategies to handle them');
        break;
      case 'action':
        recommendations.push('Build routines that support your reduced drinking goals');
        recommendations.push('Connect with others who support your goals');
        break;
      case 'maintenance':
        recommendations.push('Focus on preventing relapse by identifying high-risk situations');
        recommendations.push('Celebrate your progress and reflect on the benefits of reduced drinking');
        break;
    }
    
    // Add recommendations based on secondary stage
    if (secondaryStage) {
      if (primaryStage === 'contemplation' && secondaryStage === 'preparation') {
        recommendations.push('You\'re almost ready to take action - try setting a specific start date');
      } else if (primaryStage === 'action' && secondaryStage === 'preparation') {
        recommendations.push('Continue strengthening your plan while taking action');
      }
    }
    
    // Add recommendations based on pattern analysis
    if (stageLevels['action'].percentage > 60 && stageLevels['maintenance'].percentage < 40) {
      recommendations.push('Focus on making your changes sustainable for the long term');
    }
    
    // Limit to 3 most relevant recommendations
    return recommendations.slice(0, 3);
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
      console.log('Starting readiness assessment submission...');
      console.log('Current user:', currentUser);
      
      const profile = determineReadinessProfile();
      console.log('Readiness profile determined:', profile);
      
      // Format answers for storage
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      // Make sure we have a valid user ID
      if (!currentUser?.id) {
        console.error('User ID is missing');
        throw new Error('User ID is missing. Please try logging in again.');
      }

      console.log('Saving readiness assessment for user:', currentUser.id);
      
      // Save assessment using the storage service
      const savedAssessment = await storage.readinessAssessment.add({
        userId: currentUser.id,
        primaryStage: profile.primaryStage,
        secondaryStage: profile.secondaryStage,
        readinessScore: profile.readinessScore,
        confidenceLevel: profile.confidenceLevel,
        stageLevels: profile.stageLevels,
        recommendations: profile.recommendations,
        answers: formattedAnswers,
      });

      console.log('Readiness assessment saved successfully');
      
      // Verify the data was saved correctly
      const verifiedAssessment = await storage.readinessAssessment.get(currentUser.id);
      if (!verifiedAssessment) {
        throw new Error('Failed to verify assessment data was saved');
      }
      
      console.log('Verified assessment data:', verifiedAssessment);
      
      // Show success message with assessment details
      Alert.alert(
        'Assessment Submitted Successfully',
        `Your readiness profile: ${profile.primaryStage}\nReadiness Score: ${profile.readinessScore}%\nConfidence Level: ${profile.confidenceLevel}%`,
        [
          {
            text: 'Continue',
            onPress: () => {
              // Set isAuthenticated to true after assessment is completed
              setIsAuthenticated(true);
              console.log('Authentication state set to true');

              // Navigate to the main app
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }
          }
        ]
      );
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
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  question: {
    marginBottom: 20,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  radioLabel: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
}); 