<!-- src/routes/+page.svelte (atau /users/+page.svelte) -->
<script lang="ts">
	import { redirect } from '@sveltejs/kit';
	import type { PageData } from './$types';

	export let data: PageData;
	export let form;

	$: ({ parkingHistory, pagination, success, message, searchName } = data);

	// Fungsi untuk membuat URL pagination dengan menyertakan parameter pencarian
	function createPageUrl(url: string | null, label: string): string {
		if (!url) return '';

		// Dapatkan nomor halaman
		let pageNum = '';
		if (['1', '2', '3'].includes(label)) {
			pageNum = label;
		} else {
			const pageMatch = url.match(/page=(\d+)/);
			if (pageMatch && pageMatch[1]) {
				pageNum = pageMatch[1];
			}
		}

		// Buat URL dengan parameter pencarian jika ada
		let pageUrl = `?page=${pageNum}`;
		if (searchName) {
			pageUrl += `&name=${encodeURIComponent(searchName)}`;
		}

		return pageUrl;
	}

	function setParkingData(parking) {
		// Simpan data parkir ke dalam localStorage
		localStorage.setItem('parkingData', JSON.stringify(parking));

		// Arahkan ke halaman detail parkir
		window.location.href = `/dashboard/parking-history/detail`;
	}
</script>

<svelte:head>
	<title>Riwayat Parkir</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="mb-6 text-2xl font-semibold text-gray-800">Riwayat Parkir</h1>

	{#if !success}
		<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
			<p>{message}</p>
		</div>
	{:else if parkingHistory.length === 0}
		<div class="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-700">
			<p>
				Tidak ada pengguna yang ditemukan{searchName ? ` untuk pencarian "${searchName}"` : ''}.
			</p>
		</div>
	{:else}
		<div class="mb-4 text-center text-sm text-gray-600">
			<p>
				Menampilkan halaman {pagination.currentPage} dari {pagination.lastPage}
				(Total: {pagination.total} pengguna, {pagination.perPage} per halaman)
			</p>
		</div>

		<div class="mb-6 overflow-x-auto rounded-lg shadow-sm">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-50 text-left text-gray-700">
						<th class="px-4 py-3 font-medium">ID</th>
						<th class="px-4 py-3 font-medium">Nama</th>
						<th class="px-4 py-3 font-medium">Nomor Polisi</th>
						<th class="px-4 py-3 font-medium">Check In</th>
						<th class="px-4 py-3 font-medium">Check Out</th>
						<th class="px-4 py-3 font-medium">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each parkingHistory as parking}
						<tr class="transition-colors hover:bg-gray-50">
							<td class="px-4 py-3 text-gray-800">{parking.id}</td>
							<td class="px-4 py-3 text-gray-800">{parking.user.name}</td>
							<td class="px-4 py-3 text-gray-600">{parking.vehicle.license_plate}</td>
							<td class="px-4 py-3 text-gray-600"
								>{new Date(parking.check_in_time).toLocaleDateString()}</td
							>
							<td class="px-4 py-3 text-gray-600"
								>{parking.check_out_time
									? new Date(parking.check_out_time).toLocaleDateString()
									: '-'}</td
							>
							<td class="px-4 py-3">
								<button
									class="rounded bg-green-500 px-3 py-1 text-sm text-white transition-colors hover:bg-green-600"
									on:click={() => setParkingData(parking)}
								>
									Detail
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Navigasi pagination -->
		<div class="mt-6 flex justify-center">
			<div class="flex gap-2">
				{#each pagination.links as link}
					{#if link.url}
						<a
							href={createPageUrl(link.url, link.label)}
							class={`rounded-md border px-3 py-2 ${link.active ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
						>
							{@html link.label}
						</a>
					{:else}
						<span
							class="cursor-not-allowed rounded-md border border-gray-200 px-3 py-2 text-gray-400"
						>
							{@html link.label}
						</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
