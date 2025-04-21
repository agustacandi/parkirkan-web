import type { PageServerLoad, Actions } from './$types';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  role: string;
}

interface Vehicle {
  id: number;
  name: string;
  license_plate: string;
  image: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface ParkingHistory {
  id: number;
  check_in_time: string;
  check_in_image: string;
  check_out_time: string;
  check_out_image: string;
  status: string;
  vehicle_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  user: User;
  vehicle: Vehicle;
}

interface PaginatedResponse {
  current_page: number;
  data: ParkingHistory[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

interface ApiResponse {
  success: boolean;
  data: PaginatedResponse;
  message: string;
}

export const load: PageServerLoad = async ({ fetch, url, cookies }) => {
  // Ambil parameter dari URL
  const page = url.searchParams.get('page') || '1';
  const searchName = url.searchParams.get('name') || '';
  const token = cookies.get('auth_token') || localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  try {
    // Buat URL API dengan parameter nama jika ada
    let apiUrl = `http://localhost:8000/api/parking-all?page=${page}`;
    if (searchName) {
      apiUrl += `&name=${encodeURIComponent(searchName)}`;
    }

    const response = await fetch(apiUrl, {
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
      parkingHistory: apiResponse.data.data,
      pagination: {
        currentPage: apiResponse.data.current_page,
        lastPage: apiResponse.data.last_page,
        links: apiResponse.data.links,
        total: apiResponse.data.total,
        nextPageUrl: apiResponse.data.next_page_url,
        prevPageUrl: apiResponse.data.prev_page_url,
        perPage: apiResponse.data.per_page
      },
      success: apiResponse.success,
      message: apiResponse.message,
      searchName
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      users: [],
      pagination: {
        currentPage: 1,
        lastPage: 1,
        links: [],
        total: 0,
        nextPageUrl: null,
        prevPageUrl: null,
        perPage: 1
      },
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch users',
      searchName
    };
  }
};

export const actions: Actions = {
  // Action untuk pencarian
  search: async ({ request }) => {
    const formData = await request.formData();
    const searchName = formData.get('name')?.toString() || '';

    return { success: true, searchName };
  },
};
