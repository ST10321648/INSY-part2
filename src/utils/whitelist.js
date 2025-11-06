// ✅ Whitelist (Regex Validation Rules)

// Email (example@domain.com)
export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Password: Minimum 8 chars, 1 letter, 1 number
export const validatePassword = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

// ZAR Amount: Only numbers + decimals allowed (e.g., 1200.50 or 1200)
export const validateAmount = (amount) =>
  /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(amount); // Allows 1,000.50

// Names: Only letters and spaces
export const validateName = (name) => /^[A-Za-z\s]+$/.test(name);
