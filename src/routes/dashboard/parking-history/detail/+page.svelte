<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Definisikan tipe data untuk kendaraan
	interface Vehicle {
		id: number;
		name: string;
		license_plate: string;
		image: string;
		user_id: number;
		created_at: string;
		updated_at: string;
	}

	// Definisikan tipe data untuk user
	interface User {
		id: number;
		name: string;
		email: string;
		phone: string | null;
		email_verified_at: string | null;
		created_at: string;
		updated_at: string;
		role: string;
	}

	// Definisikan tipe data untuk parking
	interface ParkingData {
		id: number;
		check_in_time: string;
		check_in_image: string;
		check_out_time: string | null;
		check_out_image: string | null;
		status: 'parked' | 'done'; // enum untuk status
		vehicle_id: number;
		user_id: number;
		created_at: string;
		updated_at: string;
		user: User;
		vehicle: Vehicle;
	}

	let parkingData: ParkingData | null = null;
	let loading = true;
	let error = '';

	// Format date dari ISO ke format yang lebih manusiawi
	function formatDate(dateString: string | null): string {
		if (!dateString) return '-';

		const date = new Date(dateString);

		// Format: DD-MM-YYYY HH:MM
		return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
	}

	// Hitung durasi parkir
	function calculateDuration(checkIn: string, checkOut: string | null): string {
		if (!checkOut) {
			// Jika belum checkout, hitung dari sekarang
			const start = new Date(checkIn);
			const now = new Date();
			const durationMs = now.getTime() - start.getTime();

			const hours = Math.floor(durationMs / (1000 * 60 * 60));
			const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

			return `${hours} jam ${minutes} menit (berlangsung)`;
		} else {
			// Jika sudah checkout
			const start = new Date(checkIn);
			const end = new Date(checkOut);
			const durationMs = end.getTime() - start.getTime();

			const hours = Math.floor(durationMs / (1000 * 60 * 60));
			const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

			return `${hours} jam ${minutes} menit`;
		}
	}

	function getStatusBadgeClass(status: string): string {
		return status === 'parked'
			? 'bg-blue-100 text-blue-800 border-blue-400'
			: 'bg-green-100 text-green-800 border-green-400';
	}

	function getStatusText(status: string): string {
		return status === 'parked' ? 'Sedang Parkir' : 'Selesai';
	}

	function goBack() {
		goto('/dashboard/parking-history');
	}

	onMount(() => {
		try {
			// Mengambil data parkir dari localStorage
			const storedData = localStorage.getItem('parkingData');

			if (!storedData) {
				error = 'Data parkir tidak ditemukan';
				loading = false;
				return;
			}

			parkingData = JSON.parse(storedData);
			loading = false;
		} catch (err) {
			console.error('Error loading parking data:', err);
			error = 'Gagal memuat data parkir';
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Detail Parkir #{parkingData?.id}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-6 flex items-center">
		<button on:click={goBack} class="flex items-center text-gray-600 hover:text-gray-900">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="mr-2 h-5 w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
					clip-rule="evenodd"
				/>
			</svg>
			Kembali
		</button>
	</div>

	{#if loading}
		<div class="flex justify-center py-16">
			<div
				class="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"
			></div>
		</div>
	{:else if error}
		<div class="mb-6 border-l-4 border-red-400 bg-red-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg
						class="h-5 w-5 text-red-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-red-700">{error}</p>
				</div>
			</div>
		</div>
	{:else if parkingData}
		<div class="mb-6 overflow-hidden bg-white shadow sm:rounded-lg">
			<div class="flex items-center justify-between px-4 py-5 sm:px-6">
				<div>
					<h3 class="text-lg leading-6 font-medium text-gray-900">
						Detail Parkir #{parkingData.id}
					</h3>
					<p class="mt-1 max-w-2xl text-sm text-gray-500">Catatan parkir kendaraan</p>
				</div>
				<div>
					<span
						class={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getStatusBadgeClass(parkingData.status)}`}
					>
						{getStatusText(parkingData.status)}
					</span>
				</div>
			</div>

			<div class="border-t border-gray-200">
				<dl>
					<!-- Section: Informasi Parkir -->
					<div class="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">Waktu Check-in</dt>
						<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{formatDate(parkingData.check_in_time)}
						</dd>
					</div>

					<div class="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">Waktu Check-out</dt>
						<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{parkingData.check_out_time ? formatDate(parkingData.check_out_time) : '-'}
						</dd>
					</div>

					<div class="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">Durasi Parkir</dt>
						<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{calculateDuration(parkingData.check_in_time, parkingData.check_out_time)}
						</dd>
					</div>

					<!-- Section: Informasi Kendaraan -->
					<div class="bg-white px-4 py-5 sm:px-6">
						<h4 class="text-md font-medium text-gray-900">Informasi Kendaraan</h4>
					</div>

					<div class="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">Nama Kendaraan</dt>
						<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{parkingData.vehicle.name}
						</dd>
					</div>

					<div class="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">Plat Nomor</dt>
						<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{parkingData.vehicle.license_plate}
						</dd>
					</div>

					<div class="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">Foto Kendaraan</dt>
						<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							<div class="my-2">
								<img
									src={parkingData.vehicle.image}
									alt="Kendaraan"
									class="h-40 w-auto rounded-md object-cover shadow"
								/>
							</div>
						</dd>
					</div>

					<!-- Section: Informasi Pengguna -->
					<div class="bg-white px-4 py-5 sm:px-6">
						<h4 class="text-md font-medium text-gray-900">Informasi Pengguna</h4>
					</div>

					<div class="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">Nama</dt>
						<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{parkingData.user.name}
						</dd>
					</div>

					<div class="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">Email</dt>
						<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{parkingData.user.email}
						</dd>
					</div>

					<div class="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
						<dt class="text-sm font-medium text-gray-500">Telepon</dt>
						<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
							{parkingData.user.phone || '-'}
						</dd>
					</div>

					<!-- Section: Bukti Foto -->
					<div class="bg-white px-4 py-5 sm:px-6">
						<h4 class="text-md font-medium text-gray-900">Bukti Foto</h4>
					</div>

					<div class="bg-white px-4 py-4">
						<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div class="flex flex-col">
								<span class="mb-2 text-sm font-medium text-gray-500">Foto Check-in</span>
								<img
									src={parkingData.check_in_image}
									alt="Check-in"
									class="h-64 w-full rounded-md object-cover shadow"
								/>
							</div>

							{#if parkingData.check_out_image}
								<div class="flex flex-col">
									<span class="mb-2 text-sm font-medium text-gray-500">Foto Check-out</span>
									<img
										src={parkingData.check_out_image}
										alt="Check-out"
										class="h-64 w-full rounded-md object-cover shadow"
									/>
								</div>
							{:else}
								<div
									class="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-8"
								>
									<svg
										class="h-12 w-12 text-gray-400"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
									<p class="mt-2 text-sm text-gray-500">Belum ada foto check-out</p>
								</div>
							{/if}
						</div>
					</div>
				</dl>
			</div>
		</div>
	{/if}
</div>
