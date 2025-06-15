<!-- src/routes/+page.svelte (atau /users/+page.svelte) -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { isLoggedIn, getAuthToken } from '$lib/auth';
	import { apiRequest } from '$lib/utils/api';
	import { API_CONFIG } from '$lib/constants/config';

	// Tabler Icons
	import {
		IconUpload,
		IconSearch,
		IconInfoCircle,
		IconX,
		IconCircleCheck,
		IconAlertTriangle,
		IconTrash,
		IconDownload,
		IconFileText,
		IconUsers
	} from '@tabler/icons-svelte';

	export let data: PageData;
	export const form = undefined; // Fix unused export warning

	// Component state
	let users = (data as any).users || [];
	let pagination = (data as any).pagination || {
		currentPage: 1,
		lastPage: 1,
		total: 0,
		perPage: 10,
		from: 0,
		to: 0
	};
	let success = (data as any).success || false;
	let message = (data as any).message || '';
	let searchName = (data as any).searchName || '';
	let loading = false;
	let isInitialLoad = true; // Track if this is the initial load

	// Search form state
	let searchForm = {
		name: '',
		email: '',
		phone: ''
	};

	// Computed values
	$: totalUsers = pagination.total || 0;
	$: currentPage = pagination.currentPage || 1;
	$: totalPages = pagination.lastPage || 1;

	// Debug pagination
	$: {
		console.log('Pagination data:', {
			total: totalUsers,
			currentPage,
			totalPages,
			pagination
		});
	}

	// Modal states
	let showDeleteModal = false;
	let userToDelete: any = null;
	let deleting = false;

	// Toast state
	let showToast = false;
	let toastMessage = '';
	let toastType: 'success' | 'error' = 'success';

	// State untuk modal impor
	let showImportModal = false;
	let selectedFile: File | null = null;
	let uploadProgress = false;

	let cleanup: (() => void) | null = null;

	onMount(async () => {
		// Check authentication first
		if (!isLoggedIn()) {
			await goto('/?redirect=/dashboard/users');
			return;
		}

		// If server didn't provide data (needsAuth), fetch it client-side
		if ((data as any).needsAuth) {
			await fetchUsersData();
		}

		// Handle browser back/forward navigation
		const handlePopState = async () => {
			const urlPage = parseInt(new URL(window.location.href).searchParams.get('page') || '1');
			if (urlPage !== currentPage) {
				await fetchPageData(urlPage);
			}
		};

		window.addEventListener('popstate', handlePopState);

		// Store cleanup function
		cleanup = () => {
			window.removeEventListener('popstate', handlePopState);
		};

		// Mark initial load as complete
		isInitialLoad = false;
	});

	onDestroy(() => {
		if (cleanup) {
			cleanup();
		}
	});

	async function fetchUsersData() {
		const currentPage = parseInt($page.url.searchParams.get('page') || '1');

		// Update search form with all URL parameters
		searchForm.name = $page.url.searchParams.get('name') || '';
		searchForm.email = $page.url.searchParams.get('email') || '';
		searchForm.phone = $page.url.searchParams.get('phone') || '';

		// No need to track page changes anymore

		// Use the same fetch function for consistency
		await fetchPageData(currentPage);

		// Set searchName for display (legacy compatibility)
		searchName = searchForm.name;
	}

	// Search function
	async function searchUsers() {
		// Reset to page 1 for new search

		// Update URL with search parameters
		const url = new URL(window.location.href);
		url.searchParams.set('page', '1');

		// Add search parameters to URL
		if (searchForm.name.trim()) {
			url.searchParams.set('name', searchForm.name.trim());
		} else {
			url.searchParams.delete('name');
		}
		if (searchForm.email.trim()) {
			url.searchParams.set('email', searchForm.email.trim());
		} else {
			url.searchParams.delete('email');
		}
		if (searchForm.phone.trim()) {
			url.searchParams.set('phone', searchForm.phone.trim());
		} else {
			url.searchParams.delete('phone');
		}

		window.history.pushState({}, '', url.toString());

		// Fetch data for page 1 with search parameters
		await fetchPageData(1);
	}

	// Fetch page data without updating URL (for browser navigation)
	async function fetchPageData(pageNumber: number) {
		if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;

		loading = true;

		try {
			let apiUrl = `${API_CONFIG.ENDPOINTS.USERS}?page=${pageNumber}`;

			// Read search parameters from current URL
			const currentUrl = new URL(window.location.href);
			const nameParam = currentUrl.searchParams.get('name');
			const emailParam = currentUrl.searchParams.get('email');
			const phoneParam = currentUrl.searchParams.get('phone');

			if (nameParam) {
				apiUrl += `&name=${encodeURIComponent(nameParam)}`;
			}
			if (emailParam) {
				apiUrl += `&email=${encodeURIComponent(emailParam)}`;
			}
			if (phoneParam) {
				apiUrl += `&phone=${encodeURIComponent(phoneParam)}`;
			}

			const response = (await apiRequest(apiUrl, {
				method: 'GET'
			})) as any;

			if (response.success) {
				users = response.data.data;
				pagination = {
					currentPage: response.data.current_page,
					lastPage: response.data.last_page,
					links: response.data.links,
					total: response.data.total,
					nextPageUrl: response.data.next_page_url,
					prevPageUrl: response.data.prev_page_url,
					perPage: response.data.per_page,
					from: response.data.from,
					to: response.data.to
				};
				success = true;
				message = response.message;
			} else {
				success = false;
				message = response.message || 'Failed to fetch users data';
			}
		} catch (error) {
			console.error('Error fetching users data:', error);
			success = false;
			message = 'Failed to fetch users data';
		} finally {
			loading = false;
		}
	}

	// Pagination function - use client-side navigation to avoid the server-side auth issue
	async function goToPage(pageNumber: number) {
		if (pageNumber < 1 || pageNumber > totalPages) return;

		// Update URL first
		const url = new URL(window.location.href);
		url.searchParams.set('page', pageNumber.toString());
		window.history.pushState({}, '', url.toString());

		// Then fetch the data
		await fetchPageData(pageNumber);
	}

	// Export function
	async function exportUsers() {
		try {
			showToast = true;
			toastType = 'success';
			toastMessage = 'Preparing export...';

			// Fetch all users data for export
			const response = (await apiRequest(`${API_CONFIG.ENDPOINTS.USERS}?all=true`, {
				method: 'GET'
			})) as any;

			if (response.success) {
				const allUsers = response.data.data || users;

				// Create CSV content
				const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Created At'];
				const csvContent = [
					headers.join(','),
					...allUsers.map((user: any) =>
						[
							user.id,
							`"${user.name}"`,
							user.email,
							user.phone || '',
							user.role || 'user',
							new Date(user.created_at).toLocaleDateString()
						].join(',')
					)
				].join('\n');

				// Create and download file
				const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.setAttribute('href', url);
				a.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
				a.click();
				window.URL.revokeObjectURL(url);

				toastMessage = `Successfully exported ${allUsers.length} users`;
			} else {
				// Fallback: export current page data
				const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Created At'];
				const csvContent = [
					headers.join(','),
					...users.map((user: any) =>
						[
							user.id,
							`"${user.name}"`,
							user.email,
							user.phone || '',
							user.role || 'user',
							new Date(user.created_at).toLocaleDateString()
						].join(',')
					)
				].join('\n');

				const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.setAttribute('href', url);
				a.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
				a.click();
				window.URL.revokeObjectURL(url);

				toastMessage = `Exported ${users.length} users (current page)`;
			}
		} catch (error) {
			toastType = 'error';
			toastMessage = 'Failed to export users';
		}

		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	// Delete confirmation
	function confirmDelete(user: any) {
		userToDelete = user;
		showDeleteModal = true;
	}

	function cancelDelete() {
		showDeleteModal = false;
		userToDelete = null;
	}

	// Delete user function
	async function deleteUser() {
		if (!userToDelete) return;

		deleting = true;

		try {
			const response = (await apiRequest(`${API_CONFIG.ENDPOINTS.USERS}/${userToDelete.id}`, {
				method: 'DELETE'
			})) as any;

			if (response.success) {
				showToast = true;
				toastType = 'success';
				toastMessage = 'User deleted successfully';

				// Refresh the page after a short delay
				setTimeout(() => {
					window.location.reload();
				}, 1000);
			} else {
				throw new Error(response.message || 'Failed to delete user');
			}
		} catch (error) {
			showToast = true;
			toastType = 'error';
			toastMessage = (error as any).message || 'Failed to delete user';
		} finally {
			deleting = false;
			showDeleteModal = false;
			userToDelete = null;

			setTimeout(() => {
				showToast = false;
			}, 3000);
		}
	}

	// Format date function
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Fungsi untuk membuka modal impor
	function openImportModal() {
		showImportModal = true;
	}

	// Fungsi untuk menutup modal impor
	function closeImportModal() {
		showImportModal = false;
		selectedFile = null;
	}

	// Fungsi untuk menghandle perubahan file
	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			selectedFile = input.files[0];
		}
	}

	// Fungsi untuk mendownload template
	function downloadTemplate() {
		// Create CSV template with proper headers and string formatting for phone numbers
		const csvContent =
			'name,email,phone,role\n' +
			'"John Doe","john@example.com","+62123456789","user"\n' +
			'"Jane Smith","jane@example.com","+62987654321","user"\n' +
			'"Admin User","admin@example.com","+62555123456","admin"';

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.setAttribute('href', url);
		a.setAttribute('download', 'user_import_template.csv');
		a.click();
		window.URL.revokeObjectURL(url);
	}

	// Fungsi untuk menghandle import file
	async function handleImport(event: Event) {
		event.preventDefault();
		if (!selectedFile) return;

		uploadProgress = true;

		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			// Get auth token for authorization
			const token = getAuthToken();

			const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_IMPORT}`, {
				method: 'POST',
				body: formData,
				headers: {
					Authorization: `Bearer ${token}`
					// Don't set Content-Type for FormData, let browser set it with boundary
				}
			});

			const result = await response.json();

			if (result.success) {
				showToast = true;
				toastType = 'success';
				const importedCount = result.data?.imported || result.imported || 0;
				toastMessage = result.data?.message || `Successfully imported ${importedCount} users`;

				// Close modal and refresh data
				closeImportModal();
				setTimeout(() => {
					window.location.reload();
				}, 1000);
			} else {
				// Handle detailed error messages
				let errorMessage = result.message || 'Import failed';

				if (result.data?.errors && Array.isArray(result.data.errors)) {
					errorMessage += '\n\nDetailed errors:\n' + result.data.errors.join('\n');
				} else if (result.data?.details) {
					errorMessage += '\n\n' + result.data.details;
				}

				throw new Error(errorMessage);
			}
		} catch (error) {
			showToast = true;
			toastType = 'error';
			toastMessage = (error as any).message || 'Failed to import users';
		} finally {
			uploadProgress = false;
			setTimeout(() => {
				showToast = false;
			}, 3000);
		}
	}
</script>

<svelte:head>
	<title>Users - Parkirkan Admin</title>
</svelte:head>

<div class="space-y-6 lg:space-y-8">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
		<div>
			<h1
				class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl"
			>
				User Management
			</h1>
			<p class="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">Manage registered users</p>
		</div>
		<div class="flex items-center space-x-3">
			<div
				class="flex items-center space-x-2 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-gray-900/5 backdrop-blur-md sm:px-4"
			>
				<IconUsers class="h-4 w-4 text-blue-500" />
				<span class="text-xs font-medium text-gray-700 sm:text-sm">
					{totalUsers} Total Users
				</span>
			</div>
			<button
				on:click={openImportModal}
				class="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl sm:px-4 sm:text-sm"
			>
				<IconUpload class="h-3 w-3 sm:h-4 sm:w-4" />
				<span>Import</span>
			</button>
			<!-- <button
				on:click={exportUsers}
				class="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl sm:px-4 sm:text-sm"
			>
				<IconDownload class="h-3 w-3 sm:h-4 sm:w-4" />
				<span>Export</span>
			</button> -->
		</div>
	</div>

	<!-- Search Form -->
	<div class="rounded-2xl bg-white/80 p-4 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md sm:p-6">
		<form on:submit|preventDefault={searchUsers} class="space-y-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-4 lg:grid-cols-5">
				<div class="sm:col-span-3 lg:col-span-4">
					<label
						for="search-name"
						class="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
					>
						Name
					</label>
					<input
						id="search-name"
						type="text"
						bind:value={searchForm.name}
						placeholder="Search by name..."
						class="w-full rounded-xl border-0 bg-white/80 px-3 py-2 text-xs text-gray-900 ring-1 ring-gray-300 backdrop-blur-md transition-all duration-200 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 sm:px-4 sm:py-3 sm:text-sm"
					/>
				</div>
				<div class="flex items-end sm:col-span-1 lg:col-span-1">
					<button
						type="submit"
						disabled={loading}
						class="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-3 sm:text-sm"
					>
						<IconSearch class="h-3 w-3 sm:h-4 sm:w-4" />
						<span>Search</span>
					</button>
				</div>
			</div>
		</form>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-16 lg:py-20">
			<div class="text-center">
				<div
					class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 sm:h-12 sm:w-12"
				></div>
				<p class="mt-3 text-sm font-medium text-gray-600 sm:mt-4 sm:text-base">Loading users...</p>
			</div>
		</div>
	{:else if !success && !(isInitialLoad && (data as any).needsAuth)}
		<div
			class="rounded-xl border border-red-200 bg-red-50/80 p-4 ring-1 ring-red-900/5 backdrop-blur-md sm:p-6"
		>
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<IconAlertTriangle class="h-5 w-5 text-red-500 sm:h-6 sm:w-6" />
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800 sm:text-base">Error Loading Users</h3>
					<p class="mt-1 text-xs text-red-700 sm:text-sm">{message}</p>
				</div>
			</div>
		</div>
	{:else if users.length === 0}
		<div
			class="rounded-2xl bg-white/80 p-6 text-center shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md sm:p-8"
		>
			<IconInfoCircle class="mx-auto h-12 w-12 text-gray-400 sm:h-16 sm:w-16" />
			<h3 class="mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-lg">No Users Found</h3>
			<p class="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm">
				No users match your search criteria or no users are registered yet.
			</p>
		</div>
	{:else}
		<!-- Mobile Cards (visible on small screens) -->
		<div class="block space-y-4 lg:hidden">
			{#each users as user}
				<div class="rounded-2xl bg-white/80 p-4 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md">
					<div class="flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<div class="mb-2 flex items-center space-x-2">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-xs font-bold text-white"
								>
									{user.name.charAt(0).toUpperCase()}
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold text-gray-900">{user.name}</p>
									<p class="truncate text-xs text-gray-500">{user.email}</p>
								</div>
							</div>
							<div class="space-y-1">
								<div class="flex items-center text-xs text-gray-600">
									<span class="w-16 font-medium">Phone:</span>
									<span class="truncate">{user.phone || 'Not provided'}</span>
								</div>
								<div class="flex items-center text-xs text-gray-600">
									<span class="w-16 font-medium">Joined:</span>
									<span>{formatDate(user.created_at)}</span>
								</div>
							</div>
						</div>
						<button
							on:click={() => confirmDelete(user)}
							class="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors duration-200 hover:bg-red-100"
							aria-label="Delete user"
						>
							<IconTrash class="h-4 w-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>

		<!-- Desktop Table (hidden on small screens) -->
		<div class="hidden lg:block">
			<div
				class="overflow-hidden rounded-2xl bg-white/80 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md"
			>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200/50">
						<thead class="bg-gradient-to-r from-gray-50/80 to-gray-100/80">
							<tr>
								<th
									class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 sm:px-6 sm:py-4"
								>
									User
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 sm:px-6 sm:py-4"
								>
									Contact
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 sm:px-6 sm:py-4"
								>
									Join Date
								</th>
								<th
									class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-900 sm:px-6 sm:py-4"
								>
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200/50">
							{#each users as user}
								<tr class="transition-colors duration-200 hover:bg-gray-50/50">
									<td class="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
										<div class="flex items-center">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-bold text-white"
											>
												{user.name.charAt(0).toUpperCase()}
											</div>
											<div class="ml-4">
												<div class="text-sm font-semibold text-gray-900">{user.name}</div>
												<div class="text-xs text-gray-500">ID: {user.id}</div>
											</div>
										</div>
									</td>
									<td class="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
										<div class="text-sm text-gray-900">{user.email}</div>
										<div class="text-xs text-gray-500">{user.phone || 'Not provided'}</div>
									</td>
									<td class="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
										<div class="text-sm text-gray-900">{formatDate(user.created_at)}</div>
									</td>
									<td class="whitespace-nowrap px-4 py-3 text-right sm:px-6 sm:py-4">
										<button
											on:click={() => confirmDelete(user)}
											class="inline-flex items-center space-x-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors duration-200 hover:bg-red-100"
										>
											<IconTrash class="h-3 w-3" />
											<span>Delete</span>
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1 || totalUsers > 10}
			<div
				class="flex flex-col space-y-4 rounded-2xl bg-white/80 p-4 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:p-6"
			>
				<div class="text-xs text-gray-700 sm:text-sm">
					Showing <span class="font-medium"
						>{(currentPage - 1) * (pagination.perPage || 10) + 1}</span
					>
					to
					<span class="font-medium"
						>{Math.min(currentPage * (pagination.perPage || 10), totalUsers)}</span
					>
					of
					<span class="font-medium">{totalUsers}</span> users
				</div>
				<div class="flex items-center space-x-1 overflow-x-auto">
					<button
						on:click={() => goToPage(currentPage - 1)}
						disabled={currentPage === 1}
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-gray-500 ring-1 ring-gray-300 transition-all duration-200 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
					>
						<span class="sr-only">Previous</span>
						<svg class="h-3 w-3 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>

					{#each Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
						const start = Math.max(1, currentPage - 2);
						const end = Math.min(totalPages, start + 4);
						return start + i <= end ? start + i : null;
					}).filter(Boolean) as page}
						<button
							on:click={() => page && goToPage(page)}
							class="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 sm:h-10 sm:w-10 sm:text-sm {currentPage ===
							page
								? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
								: 'bg-white/80 text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50'}"
						>
							{page}
						</button>
					{/each}

					<button
						on:click={() => goToPage(currentPage + 1)}
						disabled={currentPage === totalPages}
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-gray-500 ring-1 ring-gray-300 transition-all duration-200 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
					>
						<span class="sr-only">Next</span>
						<svg class="h-3 w-3 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Modal Import -->
	{#if showImportModal}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300"
		>
			<div class="w-full max-w-md scale-100 transform transition-all duration-300">
				<div class="rounded-2xl bg-white/90 shadow-2xl ring-1 ring-gray-900/10 backdrop-blur-md">
					<!-- Header -->
					<div class="flex items-center justify-between border-b border-gray-200/50 p-6">
						<div class="flex items-center space-x-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg"
							>
								<IconUpload class="h-6 w-6 text-white" />
							</div>
							<div>
								<h2
									class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-lg font-semibold text-transparent"
								>
									Import Users
								</h2>
								<p class="text-sm text-gray-500">Upload new user data</p>
							</div>
						</div>
						<button
							class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
							on:click={closeImportModal}
							aria-label="Close modal"
						>
							<IconX class="h-5 w-5" />
						</button>
					</div>

					<div class="p-6">
						<div class="mb-6 rounded-xl bg-blue-50/80 p-4 ring-1 ring-blue-200">
							<div class="flex items-start space-x-3">
								<IconInfoCircle class="mt-0.5 h-5 w-5 text-blue-500" />
								<div>
									<p class="text-sm font-medium text-blue-800">Import Instructions</p>
									<ul class="mt-1 space-y-1 text-sm text-blue-700">
										<li>• Supported formats: Excel (.xls, .xlsx) or CSV (.csv)</li>
										<li>• Required columns: name, email</li>
										<li>• Optional columns: phone, role (user/admin)</li>
										<li>• Download template for proper format</li>
									</ul>
								</div>
							</div>
						</div>

						<div class="mb-6">
							<button
								class="flex items-center space-x-2 rounded-xl bg-gray-50/80 px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition-all duration-200 hover:bg-gray-100 hover:shadow-md"
								on:click={downloadTemplate}
							>
								<IconDownload class="h-5 w-5" />
								<span>Download Template</span>
							</button>
							<p class="mt-2 text-xs text-gray-500">
								Download template file to see the required format
							</p>
						</div>

						<form on:submit={handleImport}>
							<div class="mb-6">
								<label
									for="file-input"
									class="group block cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-50/50"
								>
									<div class="flex flex-col items-center">
										<div
											class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 transition-colors duration-200 group-hover:bg-emerald-100"
										>
											<svg
												class="h-8 w-8 text-gray-400 transition-colors duration-200 group-hover:text-emerald-500"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
												/>
											</svg>
										</div>
										<p
											class="text-lg font-medium text-gray-900 transition-colors duration-200 group-hover:text-emerald-700"
										>
											{selectedFile ? selectedFile.name : 'Choose File to Upload'}
										</p>
										<p class="mt-1 text-sm text-gray-500">
											{selectedFile ? 'Click to change file' : 'Drag & drop or click to select'}
										</p>
									</div>
								</label>
								<input
									id="file-input"
									type="file"
									name="file"
									accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
									on:change={handleFileChange}
									class="hidden"
								/>
							</div>

							{#if selectedFile}
								<div class="mb-6 rounded-xl bg-emerald-50/80 p-4 ring-1 ring-emerald-200">
									<div class="flex items-center justify-between">
										<div class="flex items-center space-x-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100"
											>
												<svg
													class="h-5 w-5 text-emerald-600"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/>
												</svg>
											</div>
											<div>
												<p class="text-sm font-medium text-emerald-800">{selectedFile.name}</p>
												<p class="text-xs text-emerald-600">
													{(selectedFile.size / 1024).toFixed(2)} KB
												</p>
											</div>
										</div>
										<button
											type="button"
											class="rounded-lg p-1 text-emerald-400 transition-colors duration-200 hover:bg-emerald-200 hover:text-emerald-600"
											on:click={() => {
												selectedFile = null;
											}}
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
								</div>
							{/if}

							<div class="flex justify-end space-x-3">
								<button
									type="button"
									class="rounded-xl bg-gray-50/80 px-6 py-3 text-sm font-medium text-gray-700 ring-1 ring-gray-200 transition-all duration-200 hover:bg-gray-100 hover:shadow-md"
									on:click={closeImportModal}
								>
									Cancel
								</button>
								<button
									type="submit"
									class="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
									disabled={!selectedFile || uploadProgress}
								>
									{#if uploadProgress}
										<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										<span>Uploading...</span>
									{:else}
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
											/>
										</svg>
										<span>Upload File</span>
									{/if}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete Confirmation Modal -->
	{#if showDeleteModal && userToDelete}
		<div
			class="fixed inset-0 z-50 overflow-y-auto"
			aria-labelledby="modal-title"
			role="dialog"
			aria-modal="true"
		>
			<div
				class="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0"
			>
				<div
					class="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity"
					aria-hidden="true"
					on:click={cancelDelete}
				></div>

				<span class="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true"
					>&#8203;</span
				>

				<div
					class="relative inline-block transform overflow-hidden rounded-2xl bg-white/95 px-4 pb-4 pt-5 text-left align-bottom shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-md transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
				>
					<div class="sm:flex sm:items-start">
						<div
							class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
						>
							<IconAlertTriangle class="h-6 w-6 text-red-600" />
						</div>
						<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
							<h3 class="text-lg font-semibold text-gray-900" id="modal-title">Delete User</h3>
							<div class="mt-2">
								<p class="text-sm text-gray-500">
									Are you sure you want to delete user <strong>{userToDelete.name}</strong>? This
									action cannot be undone.
								</p>
							</div>
						</div>
					</div>
					<div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							on:click={deleteUser}
							disabled={deleting}
							class="inline-flex w-full items-center justify-center space-x-2 rounded-xl border border-transparent bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-base font-medium text-white shadow-sm transition-all duration-200 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
						>
							{#if deleting}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								></div>
								<span>Deleting...</span>
							{:else}
								<IconTrash class="h-4 w-4" />
								<span>Delete</span>
							{/if}
						</button>
						<button
							type="button"
							on:click={cancelDelete}
							disabled={deleting}
							class="mt-3 inline-flex w-full justify-center rounded-xl border border-gray-300 bg-white/80 px-4 py-2 text-base font-medium text-gray-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto sm:text-sm"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Success/Error Toast -->
	{#if showToast}
		<div
			class="fixed bottom-4 right-4 z-50 flex items-center space-x-3 rounded-xl bg-white/95 p-4 shadow-2xl ring-1 ring-gray-900/5 backdrop-blur-md transition-all duration-300"
			class:translate-y-0={showToast}
			class:translate-y-full={!showToast}
		>
			{#if toastType === 'success'}
				<div class="flex-shrink-0">
					<IconCircleCheck class="h-5 w-5 text-green-500" />
				</div>
				<p class="text-sm font-medium text-green-800">{toastMessage}</p>
			{:else}
				<div class="flex-shrink-0">
					<IconAlertTriangle class="h-5 w-5 text-red-500" />
				</div>
				<div class="text-sm font-medium text-red-800">
					{#each toastMessage.split('\n') as line}
						<p class="mb-1 last:mb-0">{line}</p>
					{/each}
				</div>
			{/if}
			<button
				on:click={() => (showToast = false)}
				class="flex-shrink-0 rounded-lg p-1 transition-colors duration-200 hover:bg-gray-100"
			>
				<IconX class="h-4 w-4 text-gray-400" />
			</button>
		</div>
	{/if}
</div>
