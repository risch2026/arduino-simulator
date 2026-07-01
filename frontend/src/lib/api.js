import { API_URL } from './supabase';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || 'Ошибка запроса');
    }

    return res.json();
  }

  // Auth
  register(data) { return this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }); }
  login(data) { return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }); }

  // Lessons
  getLessons() { return this.request('/api/lessons'); }
  getLesson(id) { return this.request(`/api/lessons/${id}`); }
  createLesson(data) { return this.request('/api/lessons', { method: 'POST', body: JSON.stringify(data) }); }
  updateLesson(id, data) { return this.request(`/api/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteLesson(id) { return this.request(`/api/lessons/${id}`, { method: 'DELETE' }); }

  // Projects
  getProjects() { return this.request('/api/projects'); }
  createProject(data) { return this.request('/api/projects', { method: 'POST', body: JSON.stringify(data) }); }
  updateProject(id, data) { return this.request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteProject(id) { return this.request(`/api/projects/${id}`, { method: 'DELETE' }); }

  // Execute code
  executeCode(code) { return this.request('/api/execute', { method: 'POST', body: JSON.stringify({ code }) }); }
}

export const api = new ApiClient();