// src/routes/+page.server.ts (atau /users/+page.server.ts tergantung struktur Anda)
import type { PageServerLoad } from './$types';
import type { Actions } from './$types';

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

export const load: PageServerLoad = async ({ fetch, url }) => {
  // Ambil parameter dari URL
  const page = url.searchParams.get('page') || '1';
  const searchName = url.searchParams.get('name') || '';

  try {
    // Buat URL API dengan parameter nama jika ada
    let apiUrl = `http://localhost:8000/api/user?page=${page}&per_page=5`;
    if (searchName) {
      apiUrl += `&name=${encodeURIComponent(searchName)}`;
    }

    const response = await fetch(apiUrl);

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
      searchName // Mengembalikan nilai pencarian untuk digunakan di komponen
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

// Tambahkan actions untuk form
export const actions: Actions = {
  search: async ({ request, url }) => {
    const formData = await request.formData();
    const searchName = formData.get('name')?.toString() || '';

    // Redirect dengan parameter pencarian
    // Akan me-reload halaman dan dipanggil oleh load
    return { success: true, searchName };
  }
};
