// src/routes/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

interface ChartData {
  labels: string[];
  data: number[];
}

interface DashboardData {
  total_vehicles: number;
  total_users: number;
  total_parkings: number;
  chart_data: ChartData;
}

interface ApiResponse {
  success: boolean;
  data: DashboardData;
  message: string;
}

export const load: PageServerLoad = async ({ fetch, cookies }) => {
  // Try to get token from cookie first, but don't redirect if not found
  // Client-side authentication will handle the redirect
  const token = cookies.get('auth_token');

  if (!token) {
    // Return empty data, client-side will handle authentication
    return {
      dashboardData: {
        total_vehicles: 0,
        total_users: 0,
        total_parkings: 0,
        chart_data: {
          labels: [],
          data: []
        }
      },
      success: false,
      message: 'Authentication required',
      needsAuth: true
    };
  }

  try {
    const response = await fetch('http://localhost:8000/api/dashboard', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiResponse: ApiResponse = await response.json();

    return {
      dashboardData: apiResponse.data,
      success: apiResponse.success,
      message: apiResponse.message,
      needsAuth: false
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      dashboardData: {
        total_vehicles: 0,
        total_users: 0,
        total_parkings: 0,
        chart_data: {
          labels: [],
          data: []
        }
      },
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
      needsAuth: false
    };
  }
};
