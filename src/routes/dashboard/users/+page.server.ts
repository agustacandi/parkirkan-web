import type { PageServerLoad, Actions } from './$types';
import { API_CONFIG } from '$lib/constants/config';

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

interface PaginatedResponse {
  current_page: number;
  data: User[];
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

interface ImportResponse {
  success: boolean;
  data: any[];
  message: string;
}

export const load: PageServerLoad = async ({ fetch, url, cookies }) => {
  // Ambil parameter dari URL
  const page = url.searchParams.get('page') || '1';
  const searchName = url.searchParams.get('name') || '';
  const token = cookies.get('auth_token');

  // If no token from cookie, return empty data - client-side will handle authentication
  if (!token) {
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
      message: 'Authentication required',
      searchName,
      needsAuth: true
    };
  }

  try {
    // Buat URL API dengan parameter nama jika ada
    let apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}?page=${page}`;
    if (searchName) {
      apiUrl += `&name=${encodeURIComponent(searchName)}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const apiResponse: ApiResponse = await response.json();

    return {
      users: apiResponse.data.data,
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
      searchName,
      needsAuth: false
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
      searchName,
      needsAuth: false
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

  // Action untuk impor file
  import: async ({ fetch, request, cookies }) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file');
      const token = cookies.get('auth_token');

      if (!file || !(file instanceof File)) {
        return {
          success: false,
          message: 'Tidak ada file yang diunggah'
        };
      }

      // Validasi tipe file
      const acceptedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];

      if (!acceptedTypes.includes(file.type)) {
        return {
          success: false,
          message: 'Format file tidak valid. Harap unggah file Excel (.xls/.xlsx) atau CSV (.csv)'
        };
      }

      // Siapkan FormData untuk dikirim ke API
      const apiFormData = new FormData();
      apiFormData.append('file', file);

      // Kirim ke API
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_IMPORT}`, {
        method: 'POST',
        body: apiFormData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const importResponse: ImportResponse = await response.json();

      return {
        success: importResponse.success,
        message: importResponse.message
      };
    } catch (error) {
      console.error('Error importing users:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import users'
      };
    }
  }
};
