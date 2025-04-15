import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DrinkInputScreen } from '../../screens/main/DrinkInputScreen';

export const DrinkInputContainer: React.FC = () => {
  const { addDrink } = useApp();
  const [selectedDrink, setSelectedDrink] = useState<{
    category: string;
    type: string;
    brand: string;
    alcoholContent: number;
  } | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSaveDrink = async () => {
    if (!selectedDrink) {
      setSnackbarMessage('Please select a drink type');
      setSnackbarVisible(true);
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setSnackbarMessage('Please enter a valid quantity');
      setSnackbarVisible(true);
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setSnackbarMessage('Please enter a valid price');
      setSnackbarVisible(true);
      return;
    }

    try {
      await addDrink({
        ...selectedDrink,
        quantity: quantityNum,
        price: priceNum,
        location: location || 'Unknown',
        notes,
        timestamp: new Date().toISOString(),
      });
      
      setSnackbarMessage('Drink saved successfully');
      setSnackbarVisible(true);
      resetForm();
    } catch (error) {
      setSnackbarMessage('Failed to save drink');
      setSnackbarVisible(true);
    }
  };

  const handleDrinkSelect = (drinkData: {
    category: string;
    type: string;
    brand: string;
    alcoholContent: number;
  }) => {
    setSelectedDrink(drinkData);
  };

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation);
  };

  const resetForm = () => {
    setSelectedDrink(null);
    setQuantity('1');
    setPrice('');
    setLocation('');
    setNotes('');
  };

  return (
    <DrinkInputScreen
      selectedDrink={selectedDrink}
      quantity={quantity}
      price={price}
      location={location}
      notes={notes}
      snackbarVisible={snackbarVisible}
      snackbarMessage={snackbarMessage}
      onQuantityChange={setQuantity}
      onPriceChange={setPrice}
      onLocationChange={setLocation}
      onNotesChange={setNotes}
      onSnackbarDismiss={() => setSnackbarVisible(false)}
      onSaveDrink={handleSaveDrink}
      onDrinkSelect={handleDrinkSelect}
      onLocationSelect={handleLocationSelect}
      onResetForm={resetForm}
    />
  );
}; 