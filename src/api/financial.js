const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const fetchFinancialSummary = async (token) => {
  if (!token) throw new Error('Authentication required');

  const res = await fetch(`${BACKEND_URL}/api/finance/summary`, {
    headers: authHeaders(token),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Unable to fetch financial summary');
  }

  return data.summary;
};
