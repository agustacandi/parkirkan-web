<!-- src/routes/+page.svelte (or /users/+page.svelte) -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { isLoggedIn, getAuthToken } from '$lib/auth';
	import { apiRequest } from '$lib/utils/api';

	// Tabler Icons
	import {
		IconClipboardList,
		IconInfoCircle,
		IconAlertTriangle,
		IconEye,
		IconSearch,
		IconUsers
	} from '@tabler/icons-svelte';

	export let data: PageData;
	export const form = undefined;

	// Component state
	let parkingHistory = (data as any).parkingHistory || [];
	let pagination = (data as any).pagination || {};
	let success = (data as any).success || false;
	let message = (data as any).message || '';
	let searchName = (data as any).searchName || '';
	let loading = false;

	// Search form state
	let searchForm = {
		name: ''
	};

	// Computed values
	$: totalRecords = pagination.total || 0;
	$: currentPage = pagination.currentPage || 1;
	$: totalPages = pagination.lastPage || 1;

	// Function to create pagination URL with search parameters
	function createPageUrl(url: string | null, label: string): string {
		if (!url) return '';

		// Get page number
		let pageNum = '';
		if (['1', '2', '3'].includes(label)) {
			pageNum = label;
		} else {
			const pageMatch = url.match(/page=(\d+)/);
			if (pageMatch && pageMatch[1]) {
				pageNum = pageMatch[1];
			}
		}

		// Create URL with search parameters if any
		let pageUrl = `?page=${pageNum}`;
		if (searchName) {
			pageUrl += `&name=${encodeURIComponent(searchName)}`;
		}

		return pageUrl;
	}

	// Format date function
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-EN', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	onMount(async () => {
		// Check authentication first
		if (!isLoggedIn()) {
			await goto('/?redirect=/dashboard/parking-history');
			return;
		}

		// If server didn't provide data (needsAuth), fetch it client-side
		if ((data as any).needsAuth) {
			await fetchParkingHistoryData();
		}
	});

	async function fetchParkingHistoryData() {
		try {
			loading = true;
			const currentPage = $page.url.searchParams.get('page') || '1';
			const currentSearch = $page.url.searchParams.get('name') || '';

			let apiUrl = `/api/parking-all?page=${currentPage}`;
			if (currentSearch) {
				apiUrl += `&name=${encodeURIComponent(currentSearch)}`;
			}

			const response = (await apiRequest(apiUrl, {
				method: 'GET'
			})) as any;

			if (response.success) {
				parkingHistory = response.data.data;
				pagination = {
					currentPage: response.data.current_page,
					lastPage: response.data.last_page,
					links: response.data.links,
					total: response.data.total,
					nextPageUrl: response.data.next_page_url,
					prevPageUrl: response.data.prev_page_url,
					perPage: response.data.per_page
				};
				success = true;
				message = response.message;
				searchName = currentSearch;
			} else {
				success = false;
				message = response.message || 'Failed to fetch parking history data';
			}
		} catch (error) {
			console.error('Error fetching parking history data:', error);
			success = false;
			message = 'Failed to fetch parking history data';
		} finally {
			loading = false;
		}
	}

	// Search function
	async function searchParkingHistory() {
		// Update URL with search parameters
		const url = new URL(window.location.href);
		url.searchParams.set('page', '1');

		// Add search parameters to URL
		if (searchForm.name.trim()) {
			url.searchParams.set('name', searchForm.name.trim());
		} else {
			url.searchParams.delete('name');
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
			let apiUrl = `/api/parking-all?page=${pageNumber}`;

			// Read search parameters from current URL
			const currentUrl = new URL(window.location.href);
			const nameParam = currentUrl.searchParams.get('name');

			if (nameParam) {
				apiUrl += `&name=${encodeURIComponent(nameParam)}`;
			}

			const response = (await apiRequest(apiUrl, {
				method: 'GET'
			})) as any;

			if (response.success) {
				parkingHistory = response.data.data;
				pagination = {
					currentPage: response.data.current_page,
					lastPage: response.data.last_page,
					links: response.data.links,
					total: response.data.total,
					nextPageUrl: response.data.next_page_url,
					prevPageUrl: response.data.prev_page_url,
					perPage: response.data.per_page
				};
				success = true;
				message = response.message;
			} else {
				success = false;
				message = response.message || 'Failed to fetch parking history data';
			}
		} catch (error) {
			console.error('Error fetching parking history data:', error);
			success = false;
			message = 'Failed to fetch parking history data';
		} finally {
			loading = false;
		}
	}

	// Pagination function
	async function goToPage(pageNumber: number) {
		if (pageNumber < 1 || pageNumber > totalPages) return;

		// Update URL first
		const url = new URL(window.location.href);
		url.searchParams.set('page', pageNumber.toString());
		window.history.pushState({}, '', url.toString());

		// Then fetch the data
		await fetchPageData(pageNumber);
	}

	async function viewParkingDetails(parking: any) {
		// Navigate to parking detail page with ID
		await goto(`/dashboard/parking-history/detail/${parking.id}`);
	}
</script>

<svelte:head>
	<title>Parking History - Parkirkan Admin</title>
</svelte:head>

<div class="space-y-6 lg:space-y-8">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
		<div>
			<h1
				class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl"
			>
				Parking History
			</h1>
			<p class="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
				Complete history of all parking sessions
			</p>
		</div>
		<div class="flex items-center space-x-3">
			<div
				class="flex items-center space-x-2 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-gray-900/5 backdrop-blur-md sm:px-4"
			>
				<IconClipboardList class="h-4 w-4 text-blue-500" />
				<span class="text-xs font-medium text-gray-700 sm:text-sm">
					{totalRecords} Total Records
				</span>
			</div>
		</div>
	</div>

	<!-- Search Form -->
	<div class="rounded-2xl bg-white/80 p-4 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md sm:p-6">
		<form on:submit|preventDefault={searchParkingHistory} class="space-y-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-4 lg:grid-cols-5">
				<div class="sm:col-span-3 lg:col-span-4">
					<label
						for="search-name"
						class="mb-1 block text-xs font-medium text-gray-700 sm:mb-2 sm:text-sm"
					>
						User Name
					</label>
					<input
						id="search-name"
						type="text"
						bind:value={searchForm.name}
						placeholder="Search by user name..."
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
				<p class="mt-3 text-sm font-medium text-gray-600 sm:mt-4 sm:text-base">
					Loading parking history...
				</p>
			</div>
		</div>
	{:else if !success}
		<div
			class="rounded-xl border border-red-200 bg-red-50/80 p-4 ring-1 ring-red-900/5 backdrop-blur-md sm:p-6"
		>
			<div class="flex items-start">
				<div class="flex-shrink-0">
					<IconAlertTriangle class="h-5 w-5 text-red-500 sm:h-6 sm:w-6" />
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800 sm:text-base">
						Error Loading Parking History
					</h3>
					<p class="mt-1 text-xs text-red-700 sm:text-sm">{message}</p>
				</div>
			</div>
		</div>
	{:else if parkingHistory.length === 0}
		<div
			class="rounded-2xl bg-white/80 p-6 text-center shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md sm:p-8"
		>
			<IconInfoCircle class="mx-auto h-12 w-12 text-gray-400 sm:h-16 sm:w-16" />
			<h3 class="mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-lg">
				No Parking History Found
			</h3>
			<p class="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm">
				{searchName
					? `No parking history found for search "${searchName}".`
					: 'No parking history records available yet.'}
			</p>
		</div>
	{:else}
		<!-- Mobile Cards (visible on small screens) -->
		<div class="block space-y-4 lg:hidden">
			{#each parkingHistory as parking}
				<div class="rounded-2xl bg-white/80 p-4 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md">
					<div class="flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<div class="mb-2 flex items-center space-x-2">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-xs font-bold text-white"
								>
									{parking.user.name.charAt(0).toUpperCase()}
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold text-gray-900">{parking.user.name}</p>
									<p class="truncate text-xs text-gray-500">#{parking.id}</p>
								</div>
							</div>
							<div class="space-y-1">
								<div class="flex items-center text-xs text-gray-600">
									<span class="w-20 font-medium">License:</span>
									<span class="truncate">{parking.vehicle.license_plate}</span>
								</div>
								<div class="flex items-center text-xs text-gray-600">
									<span class="w-20 font-medium">Check In:</span>
									<span>{formatDate(parking.check_in_time)}</span>
								</div>
								<div class="flex items-center text-xs text-gray-600">
									<span class="w-20 font-medium">Check Out:</span>
									<span
										>{parking.check_out_time
											? formatDate(parking.check_out_time)
											: 'Still parked'}</span
									>
								</div>
							</div>
						</div>
						<button
							on:click={() => viewParkingDetails(parking)}
							class="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors duration-200 hover:bg-blue-100"
							aria-label="View details"
						>
							<IconEye class="h-4 w-4" />
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
									Vehicle
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 sm:px-6 sm:py-4"
								>
									Check In
								</th>
								<th
									class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 sm:px-6 sm:py-4"
								>
									Check Out
								</th>
								<th
									class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-900 sm:px-6 sm:py-4"
								>
									Actions
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200/50">
							{#each parkingHistory as parking}
								<tr class="transition-colors duration-200 hover:bg-gray-50/50">
									<td class="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
										<div class="flex items-center">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-bold text-white"
											>
												{parking.user.name.charAt(0).toUpperCase()}
											</div>
											<div class="ml-4">
												<div class="text-sm font-semibold text-gray-900">{parking.user.name}</div>
												<div class="text-xs text-gray-500">ID: #{parking.id}</div>
											</div>
										</div>
									</td>
									<td class="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
										<div class="text-sm text-gray-900">{parking.vehicle.license_plate}</div>
										<div class="text-xs text-gray-500">{parking.user.email}</div>
									</td>
									<td class="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
										<div class="text-sm text-gray-900">{formatDate(parking.check_in_time)}</div>
									</td>
									<td class="whitespace-nowrap px-4 py-3 sm:px-6 sm:py-4">
										<div class="text-sm text-gray-900">
											{parking.check_out_time ? formatDate(parking.check_out_time) : 'Still parked'}
										</div>
									</td>
									<td class="whitespace-nowrap px-4 py-3 text-right sm:px-6 sm:py-4">
										<button
											on:click={() => viewParkingDetails(parking)}
											class="inline-flex items-center space-x-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors duration-200 hover:bg-blue-100"
										>
											<IconEye class="h-3 w-3" />
											<span>Details</span>
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
		{#if totalPages > 1 || totalRecords > 10}
			<div
				class="flex flex-col space-y-4 rounded-2xl bg-white/80 p-4 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:p-6"
			>
				<div class="text-xs text-gray-700 sm:text-sm">
					Showing <span class="font-medium"
						>{(currentPage - 1) * (pagination.perPage || 10) + 1}</span
					>
					to
					<span class="font-medium"
						>{Math.min(currentPage * (pagination.perPage || 10), totalRecords)}</span
					>
					of
					<span class="font-medium">{totalRecords}</span> records
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
</div>
