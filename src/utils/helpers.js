// Utility functions for the PK Automations website

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(price);
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getCartTotal = (items) => {
  return items.reduce((sum, item) => sum + (item.price || 0), 0);
};

export const calculateTax = (amount, taxRate = 0.16) => {
  return Math.round(amount * taxRate);
};

export const getRandomProducts = (products, count = 3) => {
  const shuffled = [...products].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const groupProductsByCategory = (products) => {
  return products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});
};

export const searchProducts = (products, query) => {
  const lowerQuery = query.toLowerCase();
  return products.filter(product => 
    product.name.toLowerCase().includes(lowerQuery) ||
    product.description.toLowerCase().includes(lowerQuery) ||
    product.category.toLowerCase().includes(lowerQuery)
  );
};

export const sortProducts = (products, sortBy) => {
  const sorted = [...products];
  
  switch(sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':
    default:
      return sorted;
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

// Normalize Kenyan phone numbers and validate common local formats
export const normalizeKenyanPhone = (phone) => {
  if (!phone) return '';
  let p = String(phone).trim();
  // remove spaces, +, dashes, parentheses
  p = p.replace(/[\s\-\+\(\)]/g, '');
  // If starts with local 0 form like 07XXXXXXXX or 01XXXXXXXX -> convert to 2547... or 2541...
  if (/^0[17]\d{8}$/.test(p)) return '254' + p.slice(1);
  // already in international 254 format
  if (/^254[17]\d{8}$/.test(p)) return p;
  // allow short 7XXXXXXXX / 1XXXXXXXX forms and prefix 254
  if (/^[17]\d{8}$/.test(p)) return '254' + p;
  return p;
};

export const isValidKenyanPhone = (phone) => {
  const n = normalizeKenyanPhone(phone);
  return /^(?:2547\d{8}|2541\d{8})$/.test(n);
};

export const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};
