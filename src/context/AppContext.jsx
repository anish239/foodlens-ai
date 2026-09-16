import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [compareItems, setCompareItems] = useState([]);
  const [preferences, setPreferences] = useState({
    diet: 'Vegetarian',
    goals: ['High Protein', 'Low Sugar'],
    allergies: ['Nuts', 'Shellfish'],
  });

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  const addToCompare = (product) => {
    if (!product || !product.barcode) return { success: false, message: 'Invalid product' };
    
    if (compareItems.some((item) => item.barcode === product.barcode)) {
      return { success: false, message: 'Product is already in comparison list' };
    }

    if (compareItems.length >= 4) {
      return { success: false, message: 'You can compare a maximum of 4 products at a time' };
    }

    const itemToAdd = {
      barcode: String(product.barcode),
      name: product.name || 'Unknown Product',
      brand: product.brand || 'Unknown Brand',
      image: product.image || null,
    };

    setCompareItems((prev) => [...prev, itemToAdd]);
    return { success: true, message: 'Added to comparison list' };
  };

  const removeFromCompare = (barcode) => {
    setCompareItems((prev) => prev.filter((item) => item.barcode !== String(barcode)));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const isInCompare = (barcode) => {
    return compareItems.some((item) => item.barcode === String(barcode));
  };

  const value = {
    sidebarOpen,
    toggleSidebar,
    mobileMenuOpen,
    toggleMobileMenu,
    globalLoading,
    setGlobalLoading,
    preferences,
    setPreferences,
    compareItems,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};


export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
