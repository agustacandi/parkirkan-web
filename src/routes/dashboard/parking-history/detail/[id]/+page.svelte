<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { isLoggedIn, getAuthToken } from '$lib/auth';
	import { apiRequest } from '$lib/utils/api';

	// Tabler Icons
	import {
		IconArrowLeft,
		IconCar,
		IconUser,
		IconClock,
		IconCalendar,
		IconMapPin,
		IconPhoto,
		IconCheck,
		IconX,
		IconAlertTriangle,
		IconInfoCircle,
		IconLoader2
	} from '@tabler/icons-svelte';

	// Component state
	let parkingDetails: any = null;
	let loading = true;
	let error = '';
	let parkingId: string;

	// Reactive values
	$: parkingId = $page.params.id;

	onMount(async () => {
		// Check authentication first
		if (!isLoggedIn()) {
			await goto('/?redirect=/dashboard/parking-history');
			return;
		}

		await fetchParkingDetails();
	});

	async function fetchParkingDetails() {
		try {
			loading = true;
			error = '';

			const response = (await apiRequest(`/api/parking-details/${parkingId}`, {
				method: 'GET'
			})) as any;

			if (response.success) {
				parkingDetails = response.data;
			} else {
				error = response.message || 'Failed to fetch parking details';
			}
		} catch (err) {
			console.error('Error fetching parking details:', err);
			error = 'Failed to fetch parking details';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-EN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuration(duration: any): string {
		if (!duration) return '-';
		return duration.human_readable || `${duration.total_hours} hours`;
	}

	function getStatusColor(isActive: boolean, isExpired: boolean): string {
		if (isExpired) return 'bg-red-100 text-red-800 ring-red-200';
		if (isActive) return 'bg-yellow-100 text-yellow-800 ring-yellow-200';
		return 'bg-green-100 text-green-800 ring-green-200';
	}

	function getStatusText(isActive: boolean, isExpired: boolean): string {
		if (isExpired) return 'Expired';
		if (isActive) return 'Active';
		return 'Completed';
	}

	function getStatusIcon(isActive: boolean, isExpired: boolean) {
		if (isExpired) return IconAlertTriangle;
		if (isActive) return IconClock;
		return IconCheck;
	}

	async function goBack() {
		await goto('/dashboard/parking-history');
	}
</script>

<svelte:head>
	<title>Parking Details #{parkingId} - Parkirkan Admin</title>
</svelte:head>

<div class="space-y-6 lg:space-y-8">
	<!-- Header with Back Button -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
		<div class="flex items-center space-x-4">
			<button
				on:click={goBack}
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-gray-200 transition-all duration-200 hover:bg-gray-50 hover:ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				<IconArrowLeft class="h-5 w-5 text-gray-600" />
			</button>
			<div>
				<h1
					class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl"
				>
					Parking Details
				</h1>
				<p class="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
					Detailed information for parking record #{parkingId}
				</p>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-16 lg:py-20">
			<div class="text-center">
				<IconLoader2 class="mx-auto h-10 w-10 animate-spin text-blue-600 sm:h-12 sm:w-12" />
				<p class="mt-3 text-sm font-medium text-gray-600 sm:mt-4 sm:text-base">
					Loading parking details...
				</p>
			</div>
		</div>
	{:else if error}
		<div
			class="rounded-xl border border-red-200 bg-red-50/80 p-4 ring-1 ring-red-900/5 backdrop-blur-md sm:p-6"
		>
			<div class="flex items-center">
				<IconAlertTriangle class="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
				<h3 class="ml-3 text-sm font-medium text-red-800 sm:text-base">Error</h3>
			</div>
			<p class="mt-2 text-sm text-red-700 sm:text-base">{error}</p>
			<div class="mt-4">
				<button
					on:click={fetchParkingDetails}
					class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				>
					Try Again
				</button>
			</div>
		</div>
	{:else if parkingDetails}
		<div class="grid gap-6 lg:grid-cols-2 lg:gap-8">
			<!-- Parking Information Card -->
			<div
				class="rounded-xl border border-gray-200 bg-white/80 p-6 ring-1 ring-gray-900/5 backdrop-blur-md"
			>
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900 sm:text-xl">Parking Information</h2>
					{#if parkingDetails}
						{@const statusIcon = getStatusIcon(parkingDetails.is_active, parkingDetails.is_expired)}
						<span
							class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset {getStatusColor(
								parkingDetails.is_active,
								parkingDetails.is_expired
							)}"
						>
							<svelte:component this={statusIcon} class="mr-1 h-3 w-3" />
							{getStatusText(parkingDetails.is_active, parkingDetails.is_expired)}
						</span>
					{/if}
				</div>

				<div class="mt-6 space-y-4">
					<div class="flex items-center space-x-3">
						<IconInfoCircle class="h-5 w-5 text-gray-400" />
						<div>
							<p class="text-sm font-medium text-gray-500">Parking ID</p>
							<p class="text-base font-semibold text-gray-900">#{parkingDetails.parking.id}</p>
						</div>
					</div>

					<div class="flex items-center space-x-3">
						<IconCalendar class="h-5 w-5 text-gray-400" />
						<div>
							<p class="text-sm font-medium text-gray-500">Check-in Time</p>
							<p class="text-base font-semibold text-gray-900">
								{formatDate(parkingDetails.parking.check_in_time)}
							</p>
						</div>
					</div>

					{#if parkingDetails.parking.check_out_time}
						<div class="flex items-center space-x-3">
							<IconCalendar class="h-5 w-5 text-gray-400" />
							<div>
								<p class="text-sm font-medium text-gray-500">Check-out Time</p>
								<p class="text-base font-semibold text-gray-900">
									{formatDate(parkingDetails.parking.check_out_time)}
								</p>
							</div>
						</div>
					{/if}

					{#if parkingDetails.duration}
						<div class="flex items-center space-x-3">
							<IconClock class="h-5 w-5 text-gray-400" />
							<div>
								<p class="text-sm font-medium text-gray-500">Duration</p>
								<p class="text-base font-semibold text-gray-900">
									{formatDuration(parkingDetails.duration)}
								</p>
								<p class="text-sm text-gray-600">
									({parkingDetails.duration.total_minutes} minutes)
								</p>
							</div>
						</div>
					{/if}

					<div class="flex items-center space-x-3">
						<IconCheck class="h-5 w-5 text-gray-400" />
						<div>
							<p class="text-sm font-medium text-gray-500">Check-out Confirmed</p>
							<div class="flex items-center space-x-2">
								{#if parkingDetails.parking.is_check_out_confirmed}
									<IconCheck class="h-4 w-4 text-green-600" />
									<span class="text-base font-semibold text-green-600">Yes</span>
								{:else}
									<IconX class="h-4 w-4 text-red-600" />
									<span class="text-base font-semibold text-red-600">No</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- User Information Card -->
			<div
				class="rounded-xl border border-gray-200 bg-white/80 p-6 ring-1 ring-gray-900/5 backdrop-blur-md"
			>
				<h2 class="flex items-center text-lg font-semibold text-gray-900 sm:text-xl">
					<IconUser class="mr-2 h-5 w-5 text-gray-400" />
					User Information
				</h2>

				<div class="mt-6 space-y-4">
					<div>
						<p class="text-sm font-medium text-gray-500">Name</p>
						<p class="text-base font-semibold text-gray-900">{parkingDetails.parking.user.name}</p>
					</div>

					<div>
						<p class="text-sm font-medium text-gray-500">Email</p>
						<p class="text-base font-semibold text-gray-900">{parkingDetails.parking.user.email}</p>
					</div>

					{#if parkingDetails.parking.user.phone}
						<div>
							<p class="text-sm font-medium text-gray-500">Phone</p>
							<p class="text-base font-semibold text-gray-900">
								{parkingDetails.parking.user.phone}
							</p>
						</div>
					{/if}

					<div>
						<p class="text-sm font-medium text-gray-500">Role</p>
						<span
							class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
						>
							{parkingDetails.parking.user.role}
						</span>
					</div>
				</div>
			</div>

			<!-- Vehicle Information Card -->
			<div
				class="rounded-xl border border-gray-200 bg-white/80 p-6 ring-1 ring-gray-900/5 backdrop-blur-md"
			>
				<h2 class="flex items-center text-lg font-semibold text-gray-900 sm:text-xl">
					<IconCar class="mr-2 h-5 w-5 text-gray-400" />
					Vehicle Information
				</h2>

				<div class="mt-6 space-y-4">
					<div>
						<p class="text-sm font-medium text-gray-500">Vehicle Name</p>
						<p class="text-base font-semibold text-gray-900">
							{parkingDetails.parking.vehicle.name}
						</p>
					</div>

					<div>
						<p class="text-sm font-medium text-gray-500">License Plate</p>
						<p class="text-xl font-bold text-blue-600">
							{parkingDetails.parking.vehicle.license_plate}
						</p>
					</div>

					{#if parkingDetails.parking.vehicle.image}
						<div>
							<p class="mb-2 text-sm font-medium text-gray-500">Vehicle Image</p>
							<img
								src={(parkingDetails.parking.vehicle.image as String).includes(
									'default-vehicle.jpg'
								)
									? '/images/default_vehicle.webp'
									: parkingDetails.parking.vehicle.image}
								alt="Vehicle"
								class="h-64 w-full rounded-lg object-cover ring-1 ring-gray-200"
							/>
						</div>
					{/if}
				</div>
			</div>

			<!-- Images Card -->
			<div
				class="rounded-xl border border-gray-200 bg-white/80 p-6 ring-1 ring-gray-900/5 backdrop-blur-md"
			>
				<h2 class="flex items-center text-lg font-semibold text-gray-900 sm:text-xl">
					<IconPhoto class="mr-2 h-5 w-5 text-gray-400" />
					Parking Images
				</h2>

				<div class="mt-6 space-y-6">
					<!-- Check-in Image -->
					{#if parkingDetails.parking.check_in_image}
						<div>
							<p class="mb-2 text-sm font-medium text-gray-500">Check-in Image</p>
							<img
								src={(parkingDetails.parking.check_in_image as String).includes(
									'default-checkin.jpg'
								)
									? '/images/default_parking.webp'
									: parkingDetails.parking.check_in_image}
								alt="Check-in"
								class="h-48 w-full rounded-lg object-cover ring-1 ring-gray-200"
							/>
						</div>
					{:else}
						<div
							class="flex h-32 items-center justify-center rounded-lg bg-gray-50 ring-1 ring-gray-200"
						>
							<div class="text-center">
								<IconPhoto class="mx-auto h-8 w-8 text-gray-400" />
								<p class="mt-2 text-sm text-gray-500">No check-in image</p>
							</div>
						</div>
					{/if}

					<!-- Check-out Image -->
					{#if parkingDetails.parking.check_out_image}
						<div>
							<p class="mb-2 text-sm font-medium text-gray-500">Check-out Image</p>
							<img
								src={(parkingDetails.parking.check_out_image as String).includes(
									'default-checkout.jpg'
								)
									? '/images/default_parking.webp'
									: parkingDetails.parking.check_out_image}
								alt="Check-out"
								class="h-48 w-full rounded-lg object-cover ring-1 ring-gray-200"
							/>
						</div>
					{:else}
						<div
							class="flex h-32 items-center justify-center rounded-lg bg-gray-50 ring-1 ring-gray-200"
						>
							<div class="text-center">
								<IconPhoto class="mx-auto h-8 w-8 text-gray-400" />
								<p class="mt-2 text-sm text-gray-500">
									{parkingDetails.is_active ? 'Not checked out yet' : 'No check-out image'}
								</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
