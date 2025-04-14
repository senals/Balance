import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

// Tree growth stages
type TreeGrowthStage = 'sprout' | 'seedling' | 'sapling' | 'young' | 'mature';

interface TreeVisualizationProps {
  growthStage: TreeGrowthStage;
  progressPercentage: number;
}

export const TreeVisualization: React.FC<TreeVisualizationProps> = ({ 
  growthStage, 
  progressPercentage 
}) => {
  // Function to render the appropriate tree based on growth stage
  const renderTree = () => {
    switch (growthStage) {
      case 'sprout':
        return (
          <>
            {/* Sprout */}
            <View style={styles.sproutStem} />
            <View style={styles.sproutLeaf} />
          </>
        );
      case 'seedling':
        return (
          <>
            {/* Seedling trunk */}
            <View style={styles.seedlingTrunk} />
            {/* Seedling leaves */}
            <View style={[styles.seedlingLeaf, styles.seedlingLeaf1]} />
            <View style={[styles.seedlingLeaf, styles.seedlingLeaf2]} />
            <View style={[styles.seedlingLeaf, styles.seedlingLeaf3]} />
          </>
        );
      case 'sapling':
        return (
          <>
            {/* Sapling trunk */}
            <View style={styles.saplingTrunk} />
            {/* Sapling branches */}
            <View style={[styles.saplingBranch, styles.saplingBranch1]} />
            <View style={[styles.saplingBranch, styles.saplingBranch2]} />
            <View style={[styles.saplingBranch, styles.saplingBranch3]} />
            <View style={[styles.saplingBranch, styles.saplingBranch4]} />
            {/* Sapling leaves */}
            <View style={[styles.saplingLeaf, styles.saplingLeaf1]} />
            <View style={[styles.saplingLeaf, styles.saplingLeaf2]} />
            <View style={[styles.saplingLeaf, styles.saplingLeaf3]} />
            <View style={[styles.saplingLeaf, styles.saplingLeaf4]} />
            <View style={[styles.saplingLeaf, styles.saplingLeaf5]} />
          </>
        );
      case 'young':
        return (
          <>
            {/* Young tree trunk */}
            <View style={styles.youngTrunk} />
            {/* Young tree branches */}
            <View style={[styles.youngBranch, styles.youngBranch1]} />
            <View style={[styles.youngBranch, styles.youngBranch2]} />
            <View style={[styles.youngBranch, styles.youngBranch3]} />
            <View style={[styles.youngBranch, styles.youngBranch4]} />
            <View style={[styles.youngBranch, styles.youngBranch5]} />
            <View style={[styles.youngBranch, styles.youngBranch6]} />
            {/* Young tree leaves */}
            <View style={[styles.youngLeaf, styles.youngLeaf1]} />
            <View style={[styles.youngLeaf, styles.youngLeaf2]} />
            <View style={[styles.youngLeaf, styles.youngLeaf3]} />
            <View style={[styles.youngLeaf, styles.youngLeaf4]} />
            <View style={[styles.youngLeaf, styles.youngLeaf5]} />
            <View style={[styles.youngLeaf, styles.youngLeaf6]} />
            <View style={[styles.youngLeaf, styles.youngLeaf7]} />
          </>
        );
      case 'mature':
        return (
          <>
            {/* Mature tree trunk */}
            <View style={styles.matureTrunk} />
            {/* Mature tree branches */}
            <View style={[styles.matureBranch, styles.matureBranch1]} />
            <View style={[styles.matureBranch, styles.matureBranch2]} />
            <View style={[styles.matureBranch, styles.matureBranch3]} />
            <View style={[styles.matureBranch, styles.matureBranch4]} />
            <View style={[styles.matureBranch, styles.matureBranch5]} />
            <View style={[styles.matureBranch, styles.matureBranch6]} />
            <View style={[styles.matureBranch, styles.matureBranch7]} />
            <View style={[styles.matureBranch, styles.matureBranch8]} />
            <View style={[styles.matureBranch, styles.matureBranch9]} />
            <View style={[styles.matureBranch, styles.matureBranch10]} />
            {/* Mature tree leaves */}
            <View style={[styles.matureLeaf, styles.matureLeaf1]} />
            <View style={[styles.matureLeaf, styles.matureLeaf2]} />
            <View style={[styles.matureLeaf, styles.matureLeaf3]} />
            <View style={[styles.matureLeaf, styles.matureLeaf4]} />
            <View style={[styles.matureLeaf, styles.matureLeaf5]} />
            <View style={[styles.matureLeaf, styles.matureLeaf6]} />
            <View style={[styles.matureLeaf, styles.matureLeaf7]} />
            <View style={[styles.matureLeaf, styles.matureLeaf8]} />
            <View style={[styles.matureLeaf, styles.matureLeaf9]} />
            <View style={[styles.matureLeaf, styles.matureLeaf10]} />
            <View style={[styles.matureLeaf, styles.matureLeaf11]} />
          </>
        );
      default:
        return (
          <>
            {/* Default to sprout */}
            <View style={styles.sproutStem} />
            <View style={styles.sproutLeaf} />
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Sky background */}
      <View style={styles.sky}>
        {/* Clouds */}
        <View style={[styles.cloud, styles.cloud1]} />
        <View style={[styles.cloud, styles.cloud2]} />
        <View style={[styles.cloud, styles.cloud3]} />
      </View>
      
      {/* Ground */}
      <View style={styles.ground}>
        {/* Progress bar as ground fill */}
        <View 
          style={[
            styles.groundFill, 
            { width: `${progressPercentage * 100}%` }
          ]} 
        />
      </View>
      
      {/* Tree */}
      <View style={styles.treeContainer}>
        {renderTree()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#87CEEB', // Sky blue
  },
  cloud: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 20,
  },
  cloud1: {
    width: 60,
    height: 30,
    top: 20,
    left: 20,
  },
  cloud2: {
    width: 40,
    height: 20,
    top: 40,
    right: 30,
  },
  cloud3: {
    width: 50,
    height: 25,
    top: 10,
    left: 100,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#8B4513', // Brown
    overflow: 'hidden',
  },
  groundFill: {
    height: '100%',
    backgroundColor: '#228B22', // Forest green
  },
  treeContainer: {
    position: 'absolute',
    bottom: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: '70%',
  },
  
  // Sprout styles
  sproutStem: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 30,
    backgroundColor: '#228B22',
  },
  sproutLeaf: {
    position: 'absolute',
    bottom: 25,
    width: 20,
    height: 15,
    backgroundColor: '#228B22',
    transform: [{ rotate: '45deg' }],
  },
  
  // Seedling styles
  seedlingTrunk: {
    position: 'absolute',
    bottom: 0,
    width: 6,
    height: 40,
    backgroundColor: '#8B4513',
  },
  seedlingLeaf: {
    position: 'absolute',
    width: 20,
    height: 15,
    backgroundColor: '#228B22',
    transform: [{ rotate: '45deg' }],
  },
  seedlingLeaf1: {
    bottom: 35,
    left: 10,
  },
  seedlingLeaf2: {
    bottom: 30,
    right: 10,
  },
  seedlingLeaf3: {
    bottom: 25,
    left: 0,
  },
  
  // Sapling styles
  saplingTrunk: {
    position: 'absolute',
    bottom: 0,
    width: 8,
    height: 60,
    backgroundColor: '#8B4513',
  },
  saplingBranch: {
    position: 'absolute',
    width: 20,
    height: 4,
    backgroundColor: '#8B4513',
  },
  saplingBranch1: {
    bottom: 50,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  saplingBranch2: {
    bottom: 50,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  saplingBranch3: {
    bottom: 40,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  saplingBranch4: {
    bottom: 40,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  saplingLeaf: {
    position: 'absolute',
    width: 20,
    height: 15,
    backgroundColor: '#228B22',
    transform: [{ rotate: '45deg' }],
  },
  saplingLeaf1: {
    bottom: 50,
    left: 25,
  },
  saplingLeaf2: {
    bottom: 50,
    right: 25,
  },
  saplingLeaf3: {
    bottom: 40,
    left: 25,
  },
  saplingLeaf4: {
    bottom: 40,
    right: 25,
  },
  saplingLeaf5: {
    bottom: 30,
    left: 0,
  },
  
  // Young tree styles
  youngTrunk: {
    position: 'absolute',
    bottom: 0,
    width: 10,
    height: 80,
    backgroundColor: '#8B4513',
  },
  youngBranch: {
    position: 'absolute',
    width: 30,
    height: 5,
    backgroundColor: '#8B4513',
  },
  youngBranch1: {
    bottom: 70,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  youngBranch2: {
    bottom: 70,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  youngBranch3: {
    bottom: 60,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  youngBranch4: {
    bottom: 60,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  youngBranch5: {
    bottom: 50,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  youngBranch6: {
    bottom: 50,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  youngLeaf: {
    position: 'absolute',
    width: 20,
    height: 15,
    backgroundColor: '#228B22',
    transform: [{ rotate: '45deg' }],
  },
  youngLeaf1: {
    bottom: 70,
    left: 35,
  },
  youngLeaf2: {
    bottom: 70,
    right: 35,
  },
  youngLeaf3: {
    bottom: 60,
    left: 35,
  },
  youngLeaf4: {
    bottom: 60,
    right: 35,
  },
  youngLeaf5: {
    bottom: 50,
    left: 35,
  },
  youngLeaf6: {
    bottom: 50,
    right: 35,
  },
  youngLeaf7: {
    bottom: 40,
    left: 0,
  },
  
  // Mature tree styles
  matureTrunk: {
    position: 'absolute',
    bottom: 0,
    width: 12,
    height: 100,
    backgroundColor: '#8B4513',
  },
  matureBranch: {
    position: 'absolute',
    width: 40,
    height: 6,
    backgroundColor: '#8B4513',
  },
  matureBranch1: {
    bottom: 90,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  matureBranch2: {
    bottom: 90,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  matureBranch3: {
    bottom: 80,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  matureBranch4: {
    bottom: 80,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  matureBranch5: {
    bottom: 70,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  matureBranch6: {
    bottom: 70,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  matureBranch7: {
    bottom: 60,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  matureBranch8: {
    bottom: 60,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  matureBranch9: {
    bottom: 50,
    left: 10,
    transform: [{ rotate: '-30deg' }],
  },
  matureBranch10: {
    bottom: 50,
    right: 10,
    transform: [{ rotate: '30deg' }],
  },
  matureLeaf: {
    position: 'absolute',
    width: 20,
    height: 15,
    backgroundColor: '#228B22',
    transform: [{ rotate: '45deg' }],
  },
  matureLeaf1: {
    bottom: 90,
    left: 45,
  },
  matureLeaf2: {
    bottom: 90,
    right: 45,
  },
  matureLeaf3: {
    bottom: 80,
    left: 45,
  },
  matureLeaf4: {
    bottom: 80,
    right: 45,
  },
  matureLeaf5: {
    bottom: 70,
    left: 45,
  },
  matureLeaf6: {
    bottom: 70,
    right: 45,
  },
  matureLeaf7: {
    bottom: 60,
    left: 45,
  },
  matureLeaf8: {
    bottom: 60,
    right: 45,
  },
  matureLeaf9: {
    bottom: 50,
    left: 45,
  },
  matureLeaf10: {
    bottom: 50,
    right: 45,
  },
  matureLeaf11: {
    bottom: 40,
    left: 0,
  },
}); 