import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/',
});

export const getPosts = async (search = '') => {
  const response = await api.get(`blog/posts/?search=${search}`);
  return response.data;
};

export const getPost = async (slug: string) => {
  const response = await api.get(`blog/posts/${slug}/`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('blog/categories/');
  return response.data;
};

export const createComment = async (slug: string, content: string, token: string) => {
  const response = await api.post(`blog/posts/${slug}/comments/`, { content }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// --- Intake API ---

export const submitIntake = async (data: Record<string, unknown>, token: string) => {
  const response = await api.post('intake/submit/', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const uploadIntakeDocument = async (
  submissionId: number,
  docType: string,
  file: File,
  token: string
) => {
  const formData = new FormData();
  formData.append('doc_type', docType);
  formData.append('file', file);
  const response = await api.post(`intake/${submissionId}/documents/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const analyzeIntake = async (submissionId: number, token: string) => {
  const response = await api.post(`intake/${submissionId}/analyze/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getIntakeSubmission = async (submissionId: number, token: string) => {
  const response = await api.get(`intake/${submissionId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export default api;
