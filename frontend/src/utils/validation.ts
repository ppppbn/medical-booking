/**
 * Utility functions for form validation.
 * Each function returns an error message string if invalid, or an empty string if valid.
 */

export const validateRequired = (value: string | undefined | null, fieldName: string = 'Trường này'): string => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} không được để trống`;
  }
  return '';
};

export const validateMaxLength = (value: string | undefined | null, max: number, fieldName: string = 'Trường này'): string => {
  if (value && value.toString().length > max) {
    return `${fieldName} không được vượt quá ${max} ký tự`;
  }
  return '';
};

export const validateMinLength = (value: string | undefined | null, min: number, fieldName: string = 'Trường này'): string => {
  if (value && value.toString().length < min) {
    return `${fieldName} phải có ít nhất ${min} ký tự`;
  }
  return '';
};

export const validateEmail = (email: string | undefined | null): string => {
  if (!email || email.trim() === '') return ''; // let validateRequired handle empty check if needed
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Địa chỉ email không hợp lệ';
  }
  return '';
};

export const validatePhone = (phone: string | undefined | null): string => {
  if (!phone || phone.trim() === '') return ''; // let validateRequired handle empty check
  
  // Allows optional '+' at the start, followed by 10 to 11 digits
  const phoneRegex = /^\+?[0-9]{10,11}$/;
  if (!phoneRegex.test(phone.trim())) {
    return 'Số điện thoại không hợp lệ (10-11 số, có thể bắt đầu bằng +)';
  }
  return '';
};

export const validatePassword = (password: string | undefined | null): string => {
  if (!password || password.trim() === '') return ''; 
  
  if (password.length < 6) {
    return 'Mật khẩu phải có ít nhất 6 ký tự';
  }
  if (password.length > 32) {
    return 'Mật khẩu không được vượt quá 32 ký tự';
  }
  return '';
};
