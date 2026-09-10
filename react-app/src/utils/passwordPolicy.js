const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

export const passwordRequirements = 'Use at least 12 characters with uppercase, lowercase, a number, and a symbol.';

export const validateStrongPassword = (password) => STRONG_PASSWORD.test(String(password || ''));
