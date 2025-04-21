<!-- src/routes/+page.svelte (atau /users/+page.svelte) -->
<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form;

	$: ({ users, pagination, success, message, searchName } = data);

	// Nilai input pencarian
	let searchValue = searchName || '';

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

	// Fungsi untuk handle submit
	function handleSubmit() {
		// Form akan dikirim dengan enhance, ini hanya extra handler jika diperlukan
	}
</script>

<svelte:head>
	<title>Daftar Pengguna</title>
</svelte:head>

<div class="container">
	<h1>Daftar Pengguna</h1>

	<!-- Form Pencarian -->
	<div class="search-container">
		<form method="GET" class="search-form">
			<div class="search-input-group">
				<input
					type="text"
					name="name"
					placeholder="Cari berdasarkan nama..."
					value={searchName || ''}
					class="search-input"
				/>
				<button type="submit" class="search-button">Cari</button>
			</div>

			<!-- Jika ada pencarian aktif, tampilkan tombol reset -->
			{#if searchName}
				<div class="search-active">
					<span>Hasil pencarian untuk: <strong>{searchName}</strong></span>
					<a href="?page=1" class="reset-button">Reset</a>
				</div>
			{/if}
		</form>
	</div>

	{#if !success}
		<div class="alert alert-danger">
			<p>{message}</p>
		</div>
	{:else if users.length === 0}
		<div class="alert alert-info">
			<p>
				Tidak ada pengguna yang ditemukan{searchName ? ` untuk pencarian "${searchName}"` : ''}.
			</p>
		</div>
	{:else}
		<div class="pagination-info">
			<p>
				Menampilkan halaman {pagination.currentPage} dari {pagination.lastPage}
				(Total: {pagination.total} pengguna, {pagination.perPage} per halaman)
			</p>
		</div>

		<table>
			<thead>
				<tr>
					<th>ID</th>
					<th>Nama</th>
					<th>Email</th>
					<th>Nomor Telepon</th>
					<th>Role</th>
					<th>Dibuat Pada</th>
				</tr>
			</thead>
			<tbody>
				{#each users as user}
					<tr>
						<td>{user.id}</td>
						<td>{user.name}</td>
						<td>{user.email}</td>
						<td>{user.phone}</td>
						<td>{user.role}</td>
						<td>{new Date(user.created_at).toLocaleDateString()}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- Navigasi pagination -->
		<div class="pagination">
			<div class="pagination-links">
				{#each pagination.links as link}
					{#if link.url}
						<a href={createPageUrl(link.url, link.label)} class:active={link.active}>
							{@html link.label}
						</a>
					{:else}
						<span class="disabled">{@html link.label}</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	.search-container {
		margin-bottom: 1.5rem;
	}

	.search-form {
		width: 100%;
	}

	.search-input-group {
		display: flex;
		gap: 0.5rem;
	}

	.search-input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.search-button {
		padding: 0.75rem 1.5rem;
		background-color: #0275d8;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.search-button:hover {
		background-color: #0056b3;
	}

	.search-active {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.75rem;
		padding: 0.5rem;
		background-color: #f8f9fa;
		border-radius: 4px;
	}

	.reset-button {
		padding: 0.25rem 0.75rem;
		background-color: #6c757d;
		color: white;
		border: none;
		border-radius: 4px;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.reset-button:hover {
		background-color: #5a6268;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 1rem;
	}

	th,
	td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	th {
		background-color: #f5f5f5;
	}

	tr:hover {
		background-color: #f9f9f9;
	}

	.alert {
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.alert-danger {
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
		color: #721c24;
	}

	.alert-info {
		background-color: #d1ecf1;
		border: 1px solid #bee5eb;
		color: #0c5460;
	}

	.pagination-info {
		margin-bottom: 1rem;
		text-align: center;
	}

	.pagination {
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}

	.pagination-links {
		display: flex;
		gap: 0.5rem;
	}

	.pagination-links a,
	.pagination-links span {
		padding: 0.5rem 0.75rem;
		border: 1px solid #ddd;
		text-decoration: none;
		color: #333;
		border-radius: 4px;
	}

	.pagination-links a:hover {
		background-color: #f5f5f5;
	}

	.pagination-links .active {
		background-color: #0275d8;
		color: white;
		border-color: #0275d8;
	}

	.pagination-links .disabled {
		color: #aaa;
		cursor: not-allowed;
	}
</style>
