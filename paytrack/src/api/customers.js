const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const fetchCustomers = async (token) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/customers`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to fetch customers');
  return data.customers || [];
};
