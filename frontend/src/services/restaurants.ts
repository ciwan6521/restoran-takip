import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export interface Branch {
  id: number;
  restaurant: number;
  restaurant_name: string;
  name: string;
  manager: number;
  manager_name: string;
  address: string;
  notification_email: string;
  telegram_username: string;
  is_online: boolean;
  last_status_change: string;
  yemeksepeti_url: string;
  yemeksepeti_status: boolean;
  getir_url: string;
  getir_status: boolean;
  migros_api_key: string;
  migros_restaurant_id: string;
  migros_status: boolean;
  trendyol_supplier_id: string;
  trendyol_api_key: string;
  trendyol_api_secret: string;
  trendyol_status: boolean;
  created_at: string;
  updated_at: string;
  platform_statuses: {
    yemeksepeti: { url: string; status: string };
    getir: { url: string; status: string };
    migros: { api_key: string; restaurant_id: string; status: string };
    trendyol: { supplier_id: string; api_key: string; api_secret: string; status: string };
  };
}

export interface Restaurant {
  id: number;
  name: string;
  branches: Branch[];
  total_branches: number;
  online_branches: number;
  offline_branches: number;
}

export interface CreateRestaurantData {
  name: string;
}

export interface CreateBranchData {
  restaurant: number;
  name: string;
  manager: number;
  address: string;
  notification_email: string;
  telegram_username: string;
  yemeksepeti_url?: string;
  getir_url?: string;
  migros_api_key?: string;
  migros_restaurant_id?: string;
  trendyol_supplier_id?: string;
  trendyol_api_key?: string;
  trendyol_api_secret?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    }
  };
};

export const getRestaurants = async () => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/restaurants/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBranches = async () => {
  try {
    const response = await axios.get(`${API_URL}/restaurants/branches/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createRestaurant = async (data: CreateRestaurantData) => {
  try {
    const response = await axios.post(`${API_URL}/restaurants/restaurants/`, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createBranch = async (data: CreateBranchData) => {
  try {
    const response = await axios.post(`${API_URL}/restaurants/branches/`, data, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkBranchStatus = async (branchId: number) => {
  try {
    const response = await axios.post(`${API_URL}/restaurants/branches/${branchId}/check_status/`, {}, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteBranch = async (branchId: number) => {
  try {
    const response = await axios.delete(`${API_URL}/restaurants/branches/${branchId}/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteRestaurant = async (restaurantId: number) => {
  try {
    const response = await axios.delete(`${API_URL}/restaurants/restaurants/${restaurantId}/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    throw error;
  }
};
