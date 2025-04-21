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

	// State untuk modal impor
	let showImportModal = false;
	let selectedFile: File | null = null;
	let uploadProgress = false;

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

	// Fungsi untuk mendownload template
	function downloadTemplate() {
		// Ini hanya contoh sederhana, Anda mungkin perlu membuat endpoint untuk mendownload template
		const csvContent =
			'name,email,phone,role\nJohn Doe,john@example.com,62123456789,user\nJane Smith,jane@example.com,62987654321,user';
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.setAttribute('href', url);
		a.setAttribute('download', 'user_import_template.csv');
		a.click();
		window.URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Daftar Pengguna</title>
</svelte:head>

<div class="container">
	<h1>Daftar Pengguna</h1>

	<div class="action-bar">
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

		<!-- Tombol Import -->
		<div class="import-container">
			<button class="import-button" on:click={openImportModal}> Import User </button>
		</div>
	</div>

	<!-- Tampilkan pesan form submission jika ada -->
	{#if form?.message}
		<div class="alert alert-{form.success ? 'success' : 'danger'}">
			<p>{form.message}</p>
		</div>
	{/if}

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

	<!-- Modal Import -->
	{#if showImportModal}
		<div class="modal-overlay">
			<div class="modal">
				<div class="modal-header">
					<h2>Import User</h2>
					<button class="close-button" on:click={closeImportModal}>&times;</button>
				</div>

				<div class="modal-body">
					<p>Unggah file Excel (.xls, .xlsx) atau CSV (.csv) yang berisi data pengguna.</p>

					<div class="template-download">
						<button class="template-button" on:click={downloadTemplate}> Download Template </button>
						<small>Unduh file template untuk melihat format yang diperlukan</small>
					</div>

					<form
						method="POST"
						action="?/import"
						enctype="multipart/form-data"
						use:enhance={() => {
							// Sebelum submit
							uploadProgress = true;

							return async ({ result }) => {
								// Setelah submit
								uploadProgress = false;

								if (result.type === 'success' && result.data.success) {
									// Jika berhasil, tutup modal dan refresh data
									closeImportModal();
									// Refresh data setelah import berhasil (bisa dengan redirect atau cara lain)
									window.location.reload();
								}
							};
						}}
					>
						<div class="file-upload">
							<label for="file-input" class="file-label">
								{selectedFile ? selectedFile.name : 'Pilih File'}
							</label>
							<input
								id="file-input"
								type="file"
								name="file"
								accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
								on:change={handleFileChange}
								class="file-input"
							/>
						</div>

						{#if selectedFile}
							<div class="selected-file">
								<span>File terpilih: <strong>{selectedFile.name}</strong></span>
								<span class="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
							</div>
						{/if}

						<div class="modal-footer">
							<button type="button" class="cancel-button" on:click={closeImportModal}>Batal</button>
							<button
								type="submit"
								class="upload-button"
								disabled={!selectedFile || uploadProgress}
							>
								{uploadProgress ? 'Mengupload...' : 'Upload'}
							</button>
						</div>
					</form>
				</div>
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

	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}

	.search-container {
		flex: 1;
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

	.import-button {
		padding: 0.75rem 1.5rem;
		background-color: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.import-button:hover {
		background-color: #218838;
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

	.alert-success {
		background-color: #d4edda;
		border: 1px solid #c3e6cb;
		color: #155724;
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

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal {
		background-color: white;
		border-radius: 8px;
		width: 90%;
		max-width: 500px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #ddd;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6c757d;
	}

	.modal-body {
		padding: 1rem;
	}

	.file-upload {
		margin: 1.5rem 0;
	}

	.file-label {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background-color: #f8f9fa;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		text-align: center;
		width: 100%;
	}

	.file-input {
		display: none;
	}

	.selected-file {
		margin-bottom: 1rem;
		padding: 0.5rem;
		background-color: #f8f9fa;
		border-radius: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.file-size {
		color: #6c757d;
		font-size: 0.875rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}

	.cancel-button {
		padding: 0.75rem 1.5rem;
		background-color: #f8f9fa;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.upload-button {
		padding: 0.75rem 1.5rem;
		background-color: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.upload-button:hover:not(:disabled) {
		background-color: #218838;
	}

	.upload-button:disabled {
		background-color: #6c757d;
		cursor: not-allowed;
	}

	.template-download {
		margin: 1rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.template-button {
		padding: 0.5rem 1rem;
		background-color: #f8f9fa;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		width: fit-content;
	}

	.template-button:hover {
		background-color: #e2e6ea;
	}
</style>
