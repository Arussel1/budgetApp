export const CATEGORY_ICONS: Record<string, string> = {
  // Income
  'Salary': 'cash-outline',
  'Business': 'business-outline',
  'Freelance': 'laptop-outline',
  'Investment': 'trending-up-outline',
  'Gift': 'gift-outline',
  'Other Income': 'ellipsis-horizontal-circle-outline',
  
  // Expense
  'Food': 'restaurant-outline',
  'Transport': 'car-outline',
  'Shopping': 'cart-outline',
  'Housing': 'home-outline',
  'Entertainment': 'musical-notes-outline',
  'Health': 'heart-outline',
  'Education': 'book-outline',
  'Bills': 'receipt-outline',
  'Travel': 'airplane-outline',
  'Other': 'ellipsis-horizontal-circle-outline',
};

export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category] || 'pricetag-outline';
};
