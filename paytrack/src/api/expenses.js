const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const fetchExpenses = async (token) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/expenses`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to fetch expenses');
  return data.expenses || [];
};

export const createExpense = async (token, expenseData) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/expenses`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(expenseData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to create expense');
  return data.expense;
};

export const deleteExpense = async (token, id) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/expenses/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to delete expense');
  return data;
};
