import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, List, useTheme, Divider, Chip, Surface } from 'react-native-paper';
import { ReadinessAssessment } from '../services/storage';
import { getPersonalizedMessage } from '../utils/readinessMessages';

interface PersonalizedDashboardProps {
  assessment: ReadinessAssessment;
}

export const PersonalizedDashboard: React.FC<PersonalizedDashboardProps> = ({ assessment }) => {
  const theme = useTheme();
  const personalizedContent = getPersonalizedMessage(assessment);
  
  // Get color based on theme
  const getColorFromTheme = (colorName: string) => {
    switch (colorName) {
      case 'blue': return theme.colors.primary;
      case 'indigo': return '#4F46E5';
      case 'purple': return '#7C3AED';
      case 'teal': return '#0D9488';
      case 'cyan': return '#06B6D4';
      case 'green': return '#22C55E';
      case 'emerald': return '#10B981';
      case 'amber': return '#F59E0B';
      case 'orange': return '#F97316';
      case 'red': return '#EF4444';
      default: return theme.colors.primary;
    }
  };
  
  const primaryColor = getColorFromTheme(personalizedContent.colorTheme);

  return (
    <ScrollView style={styles.container}>
      <Surface style={[styles.welcomeCard, { backgroundColor: primaryColor }]} elevation={4}>
        <View style={styles.welcomeContent}>
          <Text variant="headlineMedium" style={[styles.title, { color: 'white' }]}>
            {personalizedContent.title}
          </Text>
          <Text variant="bodyLarge" style={[styles.message, { color: 'white' }]}>
            {personalizedContent.message}
          </Text>
          <Text variant="bodyMedium" style={[styles.quote, { color: 'rgba(255,255,255,0.9)' }]}>
            "{personalizedContent.motivationalQuote}"
          </Text>
        </View>
      </Surface>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Your Readiness Profile
          </Text>
          <List.Item
            title="Current Stage"
            description={assessment.primaryStage}
            left={props => <List.Icon {...props} icon="account-check" color={primaryColor} />}
          />
          <List.Item
            title="Readiness Score"
            description={`${assessment.readinessScore}%`}
            left={props => <List.Icon {...props} icon="chart-line" color={primaryColor} />}
          />
          <List.Item
            title="Confidence Level"
            description={`${assessment.confidenceLevel}%`}
            left={props => <List.Icon {...props} icon="shield-check" color={primaryColor} />}
          />
          {assessment.secondaryStage && (
            <List.Item
              title="Secondary Stage"
              description={assessment.secondaryStage}
              left={props => <List.Icon {...props} icon="account-multiple" color={primaryColor} />}
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Focus Areas
          </Text>
          <View style={styles.chipContainer}>
            {personalizedContent.focusAreas.map((area, index) => (
              <Chip 
                key={index} 
                style={[styles.chip, { backgroundColor: `${primaryColor}20` }]}
                textStyle={{ color: primaryColor }}
              >
                {area}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recommended Next Steps
          </Text>
          {personalizedContent.nextSteps.map((step, index) => (
            <List.Item
              key={index}
              title={step}
              left={props => <List.Icon {...props} icon="arrow-right" color={primaryColor} />}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Personalized Recommendations
          </Text>
          {personalizedContent.recommendations.map((recommendation, index) => (
            <List.Item
              key={index}
              title={recommendation}
              left={props => <List.Icon {...props} icon="lightbulb" color={primaryColor} />}
            />
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  welcomeContent: {
    padding: 20,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  message: {
    marginBottom: 16,
    textAlign: 'center',
  },
  quote: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    margin: 4,
  },
}); 