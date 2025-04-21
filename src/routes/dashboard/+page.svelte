<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { Car, Users, ParkingSquare } from 'lucide-svelte';
	import type { PageData } from './$types';

	// Register Chart.js components
	Chart.register(...registerables);

	export let data: PageData;

	// Destructure data from server load function
	$: ({ dashboardData, success, message } = data);

	let chart: Chart | undefined;

	onMount(() => {
		// Initialize chart
		initChart();
	});

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
						label: 'Jumlah Parkir',
						data: dashboardData.chart_data.data,
						backgroundColor: 'rgba(59, 130, 246, 0.7)',
						borderColor: 'rgb(59, 130, 246)',
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						position: 'top'
					},
					title: {
						display: true,
						text: 'Statistik Parkir Harian'
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							precision: 0
						}
					}
				}
			}
		});
	}
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="mb-6 text-2xl font-semibold text-gray-800">Dashboard</h1>

	{#if !success}
		<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
			<p>{message}</p>
		</div>
	{:else}
		<!-- Stats Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<!-- Total Vehicles Card -->
			<div class="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-md">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-500 uppercase">Total Kendaraan</p>
						<h2 class="mt-2 text-3xl font-bold">{dashboardData.total_vehicles}</h2>
					</div>
					<div class="rounded-full bg-blue-100 p-3">
						<Car class="text-blue-500" size={24} />
					</div>
				</div>
			</div>

			<!-- Total Users Card -->
			<div class="rounded-lg border-l-4 border-green-500 bg-white p-6 shadow-md">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-500 uppercase">Total Pengguna</p>
						<h2 class="mt-2 text-3xl font-bold">{dashboardData.total_users}</h2>
					</div>
					<div class="rounded-full bg-green-100 p-3">
						<Users class="text-green-500" size={24} />
					</div>
				</div>
			</div>

			<!-- Total Parkings Card -->
			<div class="rounded-lg border-l-4 border-purple-500 bg-white p-6 shadow-md">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-500 uppercase">Total Area Parkir</p>
						<h2 class="mt-2 text-3xl font-bold">{dashboardData.total_parkings}</h2>
					</div>
					<div class="rounded-full bg-purple-100 p-3">
						<ParkingSquare class="text-purple-500" size={24} />
					</div>
				</div>
			</div>
		</div>

		<!-- Chart Section -->
		<div class="rounded-lg bg-white p-6 shadow-md">
			<h3 class="mb-4 text-xl font-semibold">Statistik Parkir</h3>
			<div class="h-80">
				<canvas id="parkingChart"></canvas>
			</div>
		</div>
	{/if}
</div>
