const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const fetchSales = async (token) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/sales`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to fetch sales');
  return data.sales || [];
};

export const createSale = async (token, saleData) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/sales`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(saleData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to create sale');
  return data.sale;
};

export const verifySale = async (token, reference) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/payments/verify/${reference}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to verify sale');
  return data;
};
