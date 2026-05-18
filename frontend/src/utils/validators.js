export const validateGoalForm = (data) => {
  const errors = {};

  if (!data.thrustArea) errors.thrustArea = 'Thrust area is required';
  if (!data.title || data.title.trim().length < 5) errors.title = 'Title must be at least 5 characters';
  if (!data.uom) errors.uom = 'Unit of measurement is required';
  if (data.target === undefined || data.target === null || data.target === '') {
    errors.target = 'Target value is required';
  } else if (isNaN(data.target)) {
    errors.target = 'Target must be a number';
  }
  if (!data.weightage) {
    errors.weightage = 'Weightage is required';
  } else if (data.weightage < 10) {
    errors.weightage = 'Minimum weightage is 10%';
  } else if (data.weightage > 100) {
    errors.weightage = 'Maximum weightage is 100%';
  }

  return errors;
};

export const validateWeightageTotal = (goals) => {
  const total = goals.reduce((sum, g) => sum + (parseFloat(g.weightage) || 0), 0);
  return Math.round(total) === 100;
};

export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('At least one special character (!@#$%^&*)');
  return errors;
};

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
