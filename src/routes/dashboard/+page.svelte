<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Chart, registerables } from 'chart.js';
	import { isLoggedIn, getAuthToken } from '$lib/auth';
	import { apiRequest } from '$lib/utils/api';
	import { API_CONFIG } from '$lib/constants/config';
	import type { PageData } from './$types';

	// Tabler Icons
	import {
		IconCar,
		IconUsers,
		IconClipboardList,
		IconAlertTriangle,
		IconActivity,
		IconTrendingUp,
		IconCalendar,
		IconChartBar
	} from '@tabler/icons-svelte';

	// Register Chart.js components
	Chart.register(...registerables);

	export let data: PageData;

	// Component state
	let dashboardData = (data as any).dashboardData || {
		total_vehicles: 0,
		total_users: 0,
		total_parkings: 0,
		chart_data: { labels: [], data: [] }
	};
	let success = (data as any).success || false;
	let message = (data as any).message || '';
	let loading = false;

	let chart: Chart | undefined;

	onMount(async () => {
		// Check authentication first
		if (!isLoggedIn()) {
			await goto('/?redirect=/dashboard');
			return;
		}

		// If server didn't provide data (needsAuth), fetch it client-side
		if ((data as any).needsAuth) {
			await fetchDashboardData();
		} else {
			// Initialize chart with server data
			initChart();
		}
	});

	async function fetchDashboardData() {
		try {
			loading = true;
			const token = getAuthToken();

			if (!token) {
				await goto('/?redirect=/dashboard');
				return;
			}

			const response = (await apiRequest('/api/dashboard', {
				method: 'GET'
			})) as any;

			if (response.success) {
				dashboardData = response.data;
				success = true;
				message = response.message;
				// Re-initialize chart with new data
				initChart();
			} else {
				success = false;
				message = response.message || 'Failed to fetch dashboard data';
			}
		} catch (error) {
			console.error('Error fetching dashboard data:', error);
			success = false;
			message = 'Failed to fetch dashboard data';
		} finally {
			loading = false;
		}
	}

	function initChart(): void {
		if (!dashboardData.chart_data.labels.length) return;

		const ctx = document.getElementById('parkingChart') as HTMLCanvasElement;

		if (chart) {
			chart.destroy();
		}

		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: dashboardData.chart_data.labels,
				datasets: [
					{
						label: 'Parking Count',
						data: dashboardData.chart_data.data,
						backgroundColor: 'rgba(59, 130, 246, 0.8)',
						borderColor: 'rgb(59, 130, 246)',
						borderWidth: 2,
						borderRadius: 8,
						borderSkipped: false
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
						labels: {
							usePointStyle: true,
							padding: 20,
							font: {
								size: 14,
								weight: 'bold'
							}
						}
					},
					title: {
						display: true,
						text: 'Parking Statistics - Last 7 Days',
						font: {
							size: 16,
							weight: 'bold'
						},
						padding: 20
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							precision: 0,
							font: {
								size: 12
							}
						},
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						}
					},
					x: {
						ticks: {
							font: {
								size: 12
							}
						},
						grid: {
							display: false
						}
					}
				}
			}
		});
	}
</script>

<svelte:head>
	<title>Dashboard - Parkirkan Admin</title>
</svelte:head>

<div class="space-y-6 lg:space-y-8">
	<!-- Header -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
		<div>
			<h1
				class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl"
			>
				Dashboard
			</h1>
			<p class="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
				Welcome to Parkirkan admin panel
			</p>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-16 lg:py-20">
			<div class="text-center">
				<div
					class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 sm:h-12 sm:w-12"
				></div>
				<p class="mt-3 text-sm font-medium text-gray-600 sm:mt-4 sm:text-base">
					Loading dashboard data...
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
					<h3 class="text-sm font-medium text-red-800 sm:text-base">Error Loading Dashboard</h3>
					<p class="mt-1 text-xs text-red-700 sm:text-sm">{message}</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Statistics Cards -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
			<!-- Total Vehicles Card -->
			<div
				class="group overflow-hidden rounded-2xl bg-white/80 p-4 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:p-6"
			>
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg transition-shadow duration-300 group-hover:shadow-xl sm:h-16 sm:w-16"
						>
							<IconCar class="h-6 w-6 text-white sm:h-8 sm:w-8" />
						</div>
					</div>
					<div class="ml-4 w-0 flex-1 sm:ml-5">
						<dl>
							<dt class="truncate text-xs font-medium text-gray-500 sm:text-sm">Total Vehicles</dt>
							<dd class="flex items-baseline">
								<div class="text-xl font-bold text-gray-900 sm:text-2xl">
									{dashboardData.total_vehicles.toLocaleString()}
								</div>
								<div
									class="ml-2 flex items-baseline text-xs font-semibold text-green-600 sm:text-sm"
								>
									<IconTrendingUp class="h-3 w-3 flex-shrink-0 self-center sm:h-4 sm:w-4" />
									<span class="sr-only">Increased by</span>
									Active
								</div>
							</dd>
						</dl>
					</div>
				</div>
			</div>

			<!-- Total Users Card -->
			<div
				class="group overflow-hidden rounded-2xl bg-white/80 p-4 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:p-6"
			>
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg transition-shadow duration-300 group-hover:shadow-xl sm:h-16 sm:w-16"
						>
							<IconUsers class="h-6 w-6 text-white sm:h-8 sm:w-8" />
						</div>
					</div>
					<div class="ml-4 w-0 flex-1 sm:ml-5">
						<dl>
							<dt class="truncate text-xs font-medium text-gray-500 sm:text-sm">Total Users</dt>
							<dd class="flex items-baseline">
								<div class="text-xl font-bold text-gray-900 sm:text-2xl">
									{dashboardData.total_users.toLocaleString()}
								</div>
								<div
									class="ml-2 flex items-baseline text-xs font-semibold text-green-600 sm:text-sm"
								>
									<IconTrendingUp class="h-3 w-3 flex-shrink-0 self-center sm:h-4 sm:w-4" />
									<span class="sr-only">Increased by</span>
									Registered
								</div>
							</dd>
						</dl>
					</div>
				</div>
			</div>

			<!-- Total Parkings Card -->
			<div
				class="group overflow-hidden rounded-2xl bg-white/80 p-4 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:col-span-2 sm:p-6 lg:col-span-1"
			>
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg transition-shadow duration-300 group-hover:shadow-xl sm:h-16 sm:w-16"
						>
							<IconClipboardList class="h-6 w-6 text-white sm:h-8 sm:w-8" />
						</div>
					</div>
					<div class="ml-4 w-0 flex-1 sm:ml-5">
						<dl>
							<dt class="truncate text-xs font-medium text-gray-500 sm:text-sm">Total Parking</dt>
							<dd class="flex items-baseline">
								<div class="text-xl font-bold text-gray-900 sm:text-2xl">
									{dashboardData.total_parkings.toLocaleString()}
								</div>
								<div
									class="ml-2 flex items-baseline text-xs font-semibold text-green-600 sm:text-sm"
								>
									<IconTrendingUp class="h-3 w-3 flex-shrink-0 self-center sm:h-4 sm:w-4" />
									<span class="sr-only">Increased by</span>
									Sessions
								</div>
							</dd>
						</dl>
					</div>
				</div>
			</div>
		</div>

		<!-- Chart Section -->
		{#if dashboardData.chart_data.labels.length > 0}
			<div
				class="overflow-hidden rounded-2xl bg-white/80 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md"
			>
				<div class="border-b border-gray-200/50 px-4 py-4 sm:px-6 sm:py-5">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-lg sm:h-12 sm:w-12"
							>
								<IconChartBar class="h-5 w-5 text-white sm:h-6 sm:w-6" />
							</div>
						</div>
						<div class="ml-3 sm:ml-4">
							<h3
								class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-base font-semibold text-transparent sm:text-lg"
							>
								Parking Statistics
							</h3>
							<p class="text-xs text-gray-500 sm:text-sm">Last 7 days data</p>
						</div>
					</div>
				</div>
				<div class="p-4 sm:p-6">
					<div class="relative h-64 sm:h-80 lg:h-96">
						<canvas id="parkingChart" class="h-full w-full"></canvas>
					</div>
				</div>
			</div>
		{:else}
			<div
				class="rounded-2xl bg-white/80 p-6 text-center shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md sm:p-8"
			>
				<IconCalendar class="mx-auto h-12 w-12 text-gray-400 sm:h-16 sm:w-16" />
				<h3 class="mt-3 text-base font-semibold text-gray-900 sm:mt-4 sm:text-lg">
					No Chart Data Available
				</h3>
				<p class="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm">
					Parking statistics will appear after parking activities
				</p>
			</div>
		{/if}
	{/if}
</div>
