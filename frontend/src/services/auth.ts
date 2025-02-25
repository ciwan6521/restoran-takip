import axios from 'axios';

const API_URL = 'http://localhost:8000/api/auth';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface User {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export const login = async (data: LoginData) => {
  try {
    const response = await axios.post(`${API_URL}/login/`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Bir hata oluştu' };
  }
};

export const register = async (data: RegisterData) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Bir hata oluştu' };
  }
};

export const logout = async () => {
  try {
    const response = await axios.post(`${API_URL}/logout/`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Bir hata oluştu' };
  }
};
