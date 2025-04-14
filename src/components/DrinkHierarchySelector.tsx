import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, IconButton, Card } from 'react-native-paper';
import { colors } from '../theme/colors';

// Drink hierarchy data structure
// In a real app, this would come from a database
export const DRINK_HIERARCHY = {
  beer: {
    name: 'Beer',
    icon: '🍺',
    alcoholContent: 5,
    types: {
      lager: {
        name: 'Lager',
        brands: ['Heineken', 'Budweiser', 'Corona', 'Stella Artois', 'Carlsberg']
      },
      ale: {
        name: 'Ale',
        brands: ['Sierra Nevada', 'Guinness', 'Newcastle Brown Ale', 'Bass Pale Ale']
      },
      stout: {
        name: 'Stout',
        brands: ['Guinness', 'Murphy\'s', 'Left Hand Milk Stout', 'Samuel Smith\'s Oatmeal Stout']
      },
      ipa: {
        name: 'IPA',
        brands: ['Stone IPA', 'Dogfish Head 60 Minute IPA', 'Sierra Nevada Torpedo', 'Lagunitas IPA']
      }
    }
  },
  wine: {
    name: 'Wine',
    icon: '🍷',
    alcoholContent: 12,
    types: {
      red: {
        name: 'Red Wine',
        brands: ['Cabernet Sauvignon', 'Merlot', 'Pinot Noir', 'Malbec', 'Shiraz']
      },
      white: {
        name: 'White Wine',
        brands: ['Chardonnay', 'Sauvignon Blanc', 'Pinot Grigio', 'Riesling', 'Moscato']
      },
      rose: {
        name: 'Rosé Wine',
        brands: ['White Zinfandel', 'Provence Rosé', 'Grenache Rosé', 'Pinot Noir Rosé']
      },
      sparkling: {
        name: 'Sparkling Wine',
        brands: ['Champagne', 'Prosecco', 'Cava', 'Moscato d\'Asti']
      }
    }
  },
  spirit: {
    name: 'Spirit',
    icon: '🥃',
    alcoholContent: 40,
    types: {
      vodka: {
        name: 'Vodka',
        brands: ['Grey Goose', 'Absolut', 'Smirnoff', 'Belvedere', 'Ketel One']
      },
      gin: {
        name: 'Gin',
        brands: ['Bombay Sapphire', 'Hendrick\'s', 'Tanqueray', 'Beefeater', 'Gordon\'s']
      },
      rum: {
        name: 'Rum',
        brands: ['Bacardi', 'Captain Morgan', 'Malibu', 'Havana Club', 'Mount Gay']
      },
      whiskey: {
        name: 'Whiskey',
        brands: ['Jack Daniel\'s', 'Jameson', 'Johnnie Walker', 'Maker\'s Mark', 'Glenfiddich']
      },
      tequila: {
        name: 'Tequila',
        brands: ['Patron', 'Don Julio', 'Jose Cuervo', '1800 Tequila', 'Hornitos']
      }
    }
  },
  cocktail: {
    name: 'Cocktail',
    icon: '🍸',
    alcoholContent: 15,
    types: {
      classic: {
        name: 'Classic Cocktails',
        brands: ['Mojito', 'Margarita', 'Old Fashioned', 'Negroni', 'Manhattan']
      },
      martini: {
        name: 'Martini Variations',
        brands: ['Classic Martini', 'Espresso Martini', 'Dirty Martini', 'Appletini']
      },
      tropical: {
        name: 'Tropical Cocktails',
        brands: ['Piña Colada', 'Mai Tai', 'Daiquiri', 'Mojito', 'Hurricane']
      },
      modern: {
        name: 'Modern Cocktails',
        brands: ['Espresso Martini', 'Aperol Spritz', 'French 75', 'Penicillin']
      }
    }
  },
  cider: {
    name: 'Cider',
    icon: '🍎',
    alcoholContent: 4.5,
    types: {
      sweet: {
        name: 'Sweet Cider',
        brands: ['Strongbow', 'Magners', 'Woodchuck', 'Angry Orchard']
      },
      dry: {
        name: 'Dry Cider',
        brands: ['Aspall', 'Thatchers', 'Rekorderlig', 'Kopparberg']
      },
      flavored: {
        name: 'Flavored Cider',
        brands: ['Rekorderlig Strawberry', 'Kopparberg Pear', 'Strongbow Dark Fruits']
      }
    }
  }
};

type DrinkHierarchySelectorProps = {
  onSelectDrink: (drinkData: {
    category: string;
    type: string;
    brand: string;
    alcoholContent: number;
  }) => void;
};

export const DrinkHierarchySelector: React.FC<DrinkHierarchySelectorProps> = ({ onSelectDrink }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedType(null);
    setSelectedBrand(null);
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setSelectedBrand(null);
  };

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand);
    
    if (selectedCategory && selectedType) {
      onSelectDrink({
        category: selectedCategory,
        type: selectedType,
        brand: brand,
        alcoholContent: DRINK_HIERARCHY[selectedCategory as keyof typeof DRINK_HIERARCHY].alcoholContent
      });
    }
  };

  const renderBackButton = () => {
    if (selectedBrand) {
      return (
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => setSelectedBrand(null)}
          style={styles.backButton}
        />
      );
    } else if (selectedType) {
      return (
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => setSelectedType(null)}
          style={styles.backButton}
        />
      );
    } else if (selectedCategory) {
      return (
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => setSelectedCategory(null)}
          style={styles.backButton}
        />
      );
    }
    return null;
  };

  const renderContent = () => {
    if (selectedBrand && selectedCategory && selectedType) {
      // Show selected brand
      const category = DRINK_HIERARCHY[selectedCategory as keyof typeof DRINK_HIERARCHY];
      const type = category.types[selectedType as keyof typeof category.types];
      const brand = type.brands.find(b => b === selectedBrand);
      
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{brand}</Text>
          <Text style={styles.subtitle}>{type.name} {category.name}</Text>
          <Text style={styles.alcoholContent}>Alcohol Content: {category.alcoholContent}%</Text>
        </View>
      );
    } else if (selectedType && selectedCategory) {
      // Show brands for selected type
      const category = DRINK_HIERARCHY[selectedCategory as keyof typeof DRINK_HIERARCHY];
      const type = category.types[selectedType as keyof typeof category.types];
      
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Select {type.name}</Text>
          <View style={styles.optionsContainer}>
            {type.brands.map((brand) => (
              <TouchableOpacity
                key={brand}
                style={[
                  styles.option,
                  selectedBrand === brand && styles.selectedOption
                ]}
                onPress={() => handleBrandSelect(brand)}
              >
                <Text style={styles.optionText}>{brand}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else if (selectedCategory) {
      // Show types for selected category
      const category = DRINK_HIERARCHY[selectedCategory as keyof typeof DRINK_HIERARCHY];
      
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Select {category.name} Type</Text>
          <View style={styles.optionsContainer}>
            {Object.entries(category.types).map(([key, type]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.option,
                  selectedType === key && styles.selectedOption
                ]}
                onPress={() => handleTypeSelect(key)}
              >
                <Text style={styles.optionText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else {
      // Show categories
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Select Drink Category</Text>
          <View style={styles.optionsContainer}>
            {Object.entries(DRINK_HIERARCHY).map(([key, category]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.option,
                  selectedCategory === key && styles.selectedOption
                ]}
                onPress={() => handleCategorySelect(key)}
              >
                <Text style={styles.optionIcon}>{category.icon}</Text>
                <Text style={styles.optionText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          {renderBackButton()}
          <Text style={styles.sectionTitle}>
            {selectedBrand 
              ? 'Selected Drink' 
              : selectedType 
                ? 'Select Brand' 
                : selectedCategory 
                  ? 'Select Type' 
                  : 'Select Category'}
          </Text>
        </View>
        {renderContent()}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  contentContainer: {
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  alcoholContent: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  option: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: colors.primary + '20', // 20% opacity of primary color
    borderWidth: 2,
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
}); 