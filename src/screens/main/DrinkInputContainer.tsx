import React, { useState } from 'react';
import { DrinkInputScreen } from './DrinkInputScreen';
import { useApp } from '../../context/AppContext';

export const DrinkInputContainer = () => {
  const { addDrink } = useApp();
  const [selectedDrink, setSelectedDrink] = useState<{
    category: string;
    type: string;
    brand: string;
    alcoholContent: number;
  } | null>(null);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSaveDrink = () => {
    if (!selectedDrink) {
      setSnackbarMessage('Please select a drink');
      setSnackbarVisible(true);
      return;
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setSnackbarMessage('Please enter a valid quantity');
      setSnackbarVisible(true);
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      setSnackbarMessage('Please enter a valid price');
      setSnackbarVisible(true);
      return;
    }

    try {
      addDrink({
        ...selectedDrink,
        quantity: Number(quantity),
        price: Number(price),
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
    setQuantity('');
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