// src/validation/userValidation.ts
export interface ValidationError {
  field: string;
  message: string;
}

export function validateUsername(username: string): ValidationError | null {
  const trimmed = username.trim();
  
  if (trimmed.length < 2) {
    return { field: 'username', message: 'Username must be at least 2 characters long' };
  }
  
  if (trimmed.length > 20) {
    return { field: 'username', message: 'Username must be 20 characters or less' };
  }
  
  if (!/^[a-zA-Z0-9_\s]+$/.test(trimmed)) {
    return { field: 'username', message: 'Username can only contain letters, numbers, underscores, and spaces' };
  }
  
  // Check for inappropriate content (basic)
  const banned = ['admin', 'test', 'null', 'undefined'];
  if (banned.some(word => trimmed.toLowerCase().includes(word))) {
    return { field: 'username', message: 'Username contains restricted words' };
  }
  
  return null;
}









