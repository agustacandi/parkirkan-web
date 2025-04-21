<!-- src/routes/+page.svelte (atau route yang sudah ada) -->
<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ users, pagination, success, message } = data);

	// Fungsi untuk membuat URL pagination
	function createPageUrl(url: string | null, label: string): string {
		if (!url) return '';

		// Jika label adalah angka (halaman), gunakan angka tersebut
		if (['1', '2', '3'].includes(label)) {
			return `?page=${label}`;
		}

		// Untuk "Next" atau "Previous", ekstrak nomor halaman dari URL
		const pageMatch = url.match(/page=(\d+)/);
		if (pageMatch && pageMatch[1]) {
			return `?page=${pageMatch[1]}`;
		}

		return '';
	}
</script>

<svelte:head>
	<title>Daftar Pengguna</title>
</svelte:head>

<div class="container">
	<h1>Daftar Pengguna</h1>

	{#if !success}
		<div class="alert alert-danger">
			<p>{message}</p>
		</div>
	{:else if users.length === 0}
		<div class="alert alert-info">
			<p>Tidak ada pengguna yang ditemukan.</p>
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
						<!-- Gunakan route root dengan parameter query -->
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
