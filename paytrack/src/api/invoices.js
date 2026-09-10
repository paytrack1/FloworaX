const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const fetchInvoices = async (token) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/invoices`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to fetch invoices');
  return data.invoices || [];
};

export const createInvoice = async (token, invoiceData) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/invoices`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(invoiceData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to create invoice');
  return data.invoice;
};

export const markInvoicePaid = async (token, id) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/invoices/${id}/pay`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to update invoice');
  return data.invoice;
};

export const deleteInvoice = async (token, id) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/invoices/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to delete invoice');
  return data;
};
