import { useStore } from '../store/useStore';

export async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  
  if (response.status === 401) {
    useStore.getState().logout();
    return response;
  }
  
  return response;
}