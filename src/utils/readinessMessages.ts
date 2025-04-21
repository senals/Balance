import { ReadinessAssessment } from '../services/storage';

interface PersonalizedMessage {
  title: string;
  message: string;
  recommendations: string[];
  nextSteps: string[];
  motivationalQuote: string;
  colorTheme: string;
  focusAreas: string[];
}

const motivationalQuotes = {
  'pre-contemplation': [
    "Every journey begins with a single step.",
    "Awareness is the first step toward change.",
    "Your future self will thank you for taking this step today."
  ],
  'contemplation': [
    "The only way to do great work is to love what you do.",
    "Change is possible when you're ready.",
    "Your potential for growth is limitless."
  ],
  'preparation': [
    "Success is the sum of small efforts, repeated day in and day out.",
    "You're building the foundation for lasting change.",
    "Preparation is the key to success."
  ],
  'action': [
    "You're making progress every day.",
    "Your commitment to change is inspiring.",
    "Keep going - you're doing great!"
  ],
  'maintenance': [
    "Consistency is your superpower.",
    "You've come so far - keep up the great work!",
    "Your dedication to growth is remarkable."
  ]
};

const getRandomQuote = (stage: string): string => {
  const quotes = motivationalQuotes[stage as keyof typeof motivationalQuotes] || motivationalQuotes['pre-contemplation'];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

// Color themes for different stages and confidence levels
const colorThemes = {
  'pre-contemplation': {
    low: 'blue',
    medium: 'indigo',
    high: 'purple'
  },
  'contemplation': {
    low: 'teal',
    medium: 'cyan',
    high: 'blue'
  },
  'preparation': {
    low: 'green',
    medium: 'emerald',
    high: 'teal'
  },
  'action': {
    low: 'amber',
    medium: 'orange',
    high: 'green'
  },
  'maintenance': {
    low: 'amber',
    medium: 'orange',
    high: 'red'
  }
};

export const getPersonalizedMessage = (assessment: ReadinessAssessment): PersonalizedMessage => {
  const { primaryStage, secondaryStage, readinessScore, confidenceLevel, recommendations, stageLevels } = assessment;

  // Determine confidence level category
  const confidenceCategory = confidenceLevel < 40 ? 'low' : confidenceLevel < 70 ? 'medium' : 'high';
  
  // Get color theme based on stage and confidence
  const colorTheme = colorThemes[primaryStage as keyof typeof colorThemes]?.[confidenceCategory] || 'blue';

  // Determine focus areas based on stage levels
  const focusAreas = determineFocusAreas(stageLevels);

  const getStageSpecificContent = () => {
    // Handle transition states
    if (secondaryStage) {
      if (primaryStage === 'contemplation' && secondaryStage === 'preparation') {
        return {
          title: "Contemplation to Preparation",
          message: "You're considering change and starting to prepare. This is an exciting transition phase where you're building momentum.",
          nextSteps: [
            "Set a specific start date for your changes",
            "Create a preliminary plan for reducing drinking",
            "Identify one small change you can make today"
          ]
        };
      } else if (primaryStage === 'preparation' && secondaryStage === 'action') {
        return {
          title: "Preparation to Action",
          message: "You're ready to move from planning to action. Your preparation has laid a strong foundation for success.",
          nextSteps: [
            "Finalize your drinking reduction plan",
            "Set up your tracking system",
            "Share your goals with a supportive friend"
          ]
        };
      } else if (primaryStage === 'action' && secondaryStage === 'maintenance') {
        return {
          title: "Action to Maintenance",
          message: "You're making progress and starting to maintain your changes. This is a significant achievement!",
          nextSteps: [
            "Reflect on what strategies have worked best",
            "Identify potential challenges ahead",
            "Plan how to maintain your progress during stressful times"
          ]
        };
      }
    }

    // Handle readiness score extremes
    if (readinessScore < 20) {
      return {
        title: "Early Exploration",
        message: "You're at the beginning of your journey. There's no pressure to change - we're here to support your exploration.",
        nextSteps: [
          "Learn about different drinking patterns",
          "Explore the app features at your own pace",
          "Consider what a healthier relationship with alcohol might look like for you"
        ]
      };
    } else if (readinessScore > 80) {
      return {
        title: "Advanced Progress",
        message: "You've made significant progress in changing your drinking habits. Let's build on your success and prevent relapse.",
        nextSteps: [
          "Review your long-term goals",
          "Identify potential triggers and high-risk situations",
          "Develop a relapse prevention plan"
        ]
      };
    }

    // Handle confidence level extremes
    if (confidenceLevel < 30) {
      return {
        title: "Building Confidence",
        message: "You're taking important steps, even if you're feeling uncertain. Confidence grows with small successes.",
        nextSteps: [
          "Set very small, achievable goals",
          "Celebrate every small success",
          "Connect with others who understand your journey"
        ]
      };
    } else if (confidenceLevel > 90) {
      return {
        title: "Confident Progress",
        message: "Your high confidence is a strong asset. Use this momentum to make lasting changes.",
        nextSteps: [
          "Challenge yourself with slightly more ambitious goals",
          "Share your strategies with others who might benefit",
          "Document what's working well for you"
        ]
      };
    }

    // Standard stage-specific content
    switch (primaryStage) {
      case 'pre-contemplation':
        return {
          title: "Welcome to Your Journey",
          message: "We're here to support you as you explore your relationship with alcohol. Take your time to learn and reflect.",
          nextSteps: [
            "Explore the app features at your own pace",
            "Read about different drinking patterns",
            "Track your current habits without pressure"
          ]
        };
      case 'contemplation':
        return {
          title: "Exploring Change Together",
          message: "You're considering making changes, and that's a significant first step. We'll help you evaluate your options.",
          nextSteps: [
            "Review your drinking patterns",
            "Explore different goal-setting approaches",
            "Connect with supportive resources"
          ]
        };
      case 'preparation':
        return {
          title: "Ready for Action",
          message: "You're preparing to make changes, and we're here to help you create a solid plan for success.",
          nextSteps: [
            "Set specific, achievable goals",
            "Create your personalized drinking plan",
            "Identify your support system"
          ]
        };
      case 'action':
        return {
          title: "Taking Control",
          message: "You're actively working on changing your drinking habits. Let's celebrate your progress and keep moving forward.",
          nextSteps: [
            "Track your progress daily",
            "Use the pre-game planning feature",
            "Celebrate your achievements"
          ]
        };
      case 'maintenance':
        return {
          title: "Maintaining Your Progress",
          message: "You've made significant changes and are working to maintain them. We'll help you stay on track.",
          nextSteps: [
            "Review your long-term goals",
            "Update your strategies as needed",
            "Share your success with others"
          ]
        };
      default:
        return {
          title: "Welcome to Balance",
          message: "We're here to support you on your journey to a healthier relationship with alcohol.",
          nextSteps: [
            "Explore the app features",
            "Set your first goal",
            "Track your progress"
          ]
        };
    }
  };

  const content = getStageSpecificContent();

  return {
    ...content,
    recommendations: recommendations,
    nextSteps: content.nextSteps,
    motivationalQuote: getRandomQuote(primaryStage),
    colorTheme,
    focusAreas
  };
};

// Helper function to determine focus areas based on stage levels
const determineFocusAreas = (stageLevels: Record<string, { score: number; percentage: number }>): string[] => {
  const focusAreas: string[] = [];
  
  // Find the stage with the lowest percentage
  let lowestStage = '';
  let lowestPercentage = 100;
  
  Object.entries(stageLevels).forEach(([stage, data]) => {
    if (data.percentage < lowestPercentage) {
      lowestPercentage = data.percentage;
      lowestStage = stage;
    }
  });
  
  // Add focus areas based on the lowest stage
  switch (lowestStage) {
    case 'pre-contemplation':
      focusAreas.push('Awareness building');
      focusAreas.push('Education about drinking patterns');
      break;
    case 'contemplation':
      focusAreas.push('Exploring motivation');
      focusAreas.push('Identifying pros and cons of change');
      break;
    case 'preparation':
      focusAreas.push('Goal setting');
      focusAreas.push('Planning strategies');
      break;
    case 'action':
      focusAreas.push('Implementation');
      focusAreas.push('Tracking progress');
      break;
    case 'maintenance':
      focusAreas.push('Preventing relapse');
      focusAreas.push('Building long-term habits');
      break;
  }
  
  // Add a general focus area
  focusAreas.push('Building support system');
  
  return focusAreas;
}; 