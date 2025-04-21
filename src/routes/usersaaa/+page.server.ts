// src/routes/+page.server.ts (atau route yang sudah ada)
import type { PageServerLoad } from './$types';

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
  // Ambil parameter halaman dari URL jika ada, default ke 1
  const page = url.searchParams.get('page') || '1';

  try {
    const apiUrl = `http://localhost:8000/api/user?page=${page}&per_page=1`;
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
      message: apiResponse.message
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
      message: error instanceof Error ? error.message : 'Failed to fetch users'
    };
  }
};
