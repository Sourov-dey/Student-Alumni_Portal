export function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: 'Weak', color: '#f87171' };
  if (score <= 4) return { label: 'Medium', color: '#facc15' };
  return { label: 'Strong', color: '#4ade80' };
}
