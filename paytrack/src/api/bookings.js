const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const fetchBookings = async (token) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/bookings`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to fetch bookings');
  return data.bookings || [];
};

export const createBooking = async (token, bookingData) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/bookings`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(bookingData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to create booking');
  return data.booking;
};

export const updateBooking = async (token, id, bookingData) => {
  if (!token) throw new Error('Authentication required');
  const res = await fetch(`${BACKEND_URL}/api/bookings/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(bookingData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to update booking');
  return data.booking;
};
