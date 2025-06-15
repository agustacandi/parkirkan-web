<!-- src/routes/+page.svelte (atau /users/+page.svelte) -->
<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form;

	$: ({ users, pagination, success, message, searchName } = data);

	// Search input value
	let searchValue = searchName || '';

	// State for import modal
	let showImportModal = false;
	let selectedFile: File | null = null;
	let uploadProgress = false;

	// State for delete confirmation modal
	let showDeleteModal = false;
	let userToDelete = null;
	let deleteInProgress = false;
	let deleteError = '';

	// Function to open import modal
	function openImportModal() {
		showImportModal = true;
	}

	// Function to close import modal
	function closeImportModal() {
		showImportModal = false;
		selectedFile = null;
	}

	// Function to confirm user deletion
	function confirmDelete(user) {
		userToDelete = user;
		showDeleteModal = true;
	}

	// Function to close confirmation modal
	function closeDeleteModal() {
		showDeleteModal = false;
		userToDelete = null;
		deleteError = '';
	}

	// Function to delete user
	async function deleteUser() {
		if (!userToDelete) return;

		deleteInProgress = true;
		deleteError = '';

		try {
			const response = await fetch(`http://localhost:8000/api/user/${userToDelete.id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to delete user');
			}

			// If deletion successful, refresh page
			window.location.reload();
		} catch (error) {
			deleteError = error.message || 'An error occurred while deleting user';
		} finally {
			deleteInProgress = false;
		}
	}

	// Function to handle file change
	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			selectedFile = input.files[0];
		}
	}

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

	// Function to download template
	function downloadTemplate() {
		// Simple example, you might need to create an endpoint for template download
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
	<title>User List</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="mb-6 text-2xl font-semibold text-gray-800">User List</h1>

	<div class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row">
		<!-- Search Form -->
		<div class="w-full md:w-2/3">
			<form method="GET" class="w-full">
				<div class="flex gap-2">
					<input
						type="text"
						name="name"
						placeholder="Search by name..."
						value={searchName || ''}
						class="flex-1 rounded-md border border-gray-200 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
					<button
						type="submit"
						class="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
					>
						Search
					</button>
				</div>

				<!-- If there's an active search, show reset button -->
				{#if searchName}
					<div class="mt-2 flex items-center justify-between rounded-md bg-gray-50 p-2 text-sm">
						<span>Search results for: <strong>{searchName}</strong></span>
						<a
							href="?page=1"
							class="rounded-md bg-gray-500 px-2 py-1 text-xs text-white transition-colors hover:bg-gray-600"
							>Reset</a
						>
					</div>
				{/if}
			</form>
		</div>

		<!-- Import Button -->
		<div class="w-full md:w-auto">
			<button
				class="w-full rounded-md bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600 md:w-auto"
				on:click={openImportModal}
			>
				Import Users
			</button>
		</div>
	</div>

	<!-- Show form submission message if any -->
	{#if form?.message}
		<div
			class={`mb-4 rounded-md p-4 ${form.success ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700'}`}
		>
			<p>{form.message}</p>
		</div>
	{/if}

	{#if !success}
		<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
			<p>{message}</p>
		</div>
	{:else if users.length === 0}
		<div class="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-700">
			<p>
				No users found{searchName ? ` for search "${searchName}"` : ''}.
			</p>
		</div>
	{:else}
		<div class="mb-4 text-center text-sm text-gray-600">
			<p>
				Showing page {pagination.currentPage} of {pagination.lastPage}
				(Total: {pagination.total} users, {pagination.perPage} per page)
			</p>
		</div>

		<div class="mb-6 overflow-x-auto rounded-lg shadow-sm">
			<table class="w-full">
				<thead>
					<tr class="bg-gray-50 text-left text-gray-700">
						<th class="px-4 py-3 font-medium">ID</th>
						<th class="px-4 py-3 font-medium">Name</th>
						<th class="px-4 py-3 font-medium">Email</th>
						<th class="px-4 py-3 font-medium">Phone Number</th>
						<th class="px-4 py-3 font-medium">Role</th>
						<th class="px-4 py-3 font-medium">Created At</th>
						<th class="px-4 py-3 font-medium">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each users as user}
						<tr class="transition-colors hover:bg-gray-50">
							<td class="px-4 py-3 text-gray-800">{user.id}</td>
							<td class="px-4 py-3 text-gray-800">{user.name}</td>
							<td class="px-4 py-3 text-gray-600">{user.email}</td>
							<td class="px-4 py-3 text-gray-600">{user.phone}</td>
							<td class="px-4 py-3 text-gray-600">{user.role}</td>
							<td class="px-4 py-3 text-gray-600"
								>{new Date(user.created_at).toLocaleDateString()}</td
							>
							<td class="px-4 py-3">
								<button
									class="rounded bg-red-500 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600"
									on:click={() => confirmDelete(user)}
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination navigation -->
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

	<!-- Modal Import -->
	{#if showImportModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div class="w-full max-w-md rounded-lg bg-white shadow-lg">
				<div class="flex items-center justify-between border-b p-4">
					<h2 class="text-lg font-medium text-gray-800">Import Users</h2>
					<button class="text-2xl text-gray-500 hover:text-gray-700" on:click={closeImportModal}
						>&times;</button
					>
				</div>

				<div class="p-6">
					<p class="mb-4 text-gray-600">
						Upload Excel (.xls, .xlsx) or CSV (.csv) file containing user data.
					</p>

					<div class="mb-6">
						<button
							class="rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
							on:click={downloadTemplate}
						>
							Download Template
						</button>
						<div class="mt-1 text-xs text-gray-500">
							Download template file to see the required format
						</div>
					</div>

					<form
						method="POST"
						action="?/import"
						enctype="multipart/form-data"
						use:enhance={() => {
							// Before submit
							uploadProgress = true;

							return async ({ result }) => {
								// After submit
								uploadProgress = false;

								if (result.type === 'success' && result.data.success) {
									// If successful, close modal and refresh data
									closeImportModal();
									// Refresh data after successful import (can be done with redirect or other methods)
									window.location.reload();
								}
							};
						}}
					>
						<div class="mb-4">
							<label
								for="file-input"
								class="block cursor-pointer rounded-md border-2 border-dashed border-gray-300 p-3 text-center transition-colors hover:bg-gray-50"
							>
								{selectedFile ? selectedFile.name : 'Choose File'}
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
							<div class="mb-4 flex items-center justify-between rounded-md bg-gray-50 p-2 text-sm">
								<span>Selected file: <strong>{selectedFile.name}</strong></span>
								<span class="text-gray-500">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
							</div>
						{/if}

						<div class="mt-6 flex justify-end gap-3">
							<button
								type="button"
								class="rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
								on:click={closeImportModal}
							>
								Cancel
							</button>
							<button
								type="submit"
								class="rounded-md bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-400"
								disabled={!selectedFile || uploadProgress}
							>
								{uploadProgress ? 'Uploading...' : 'Upload'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal Konfirmasi Hapus -->
	{#if showDeleteModal && userToDelete}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div class="w-full max-w-md rounded-lg bg-white shadow-lg">
				<div class="flex items-center justify-between border-b p-4">
					<h2 class="text-lg font-medium text-gray-800">Delete Confirmation</h2>
					<button class="text-2xl text-gray-500 hover:text-gray-700" on:click={closeDeleteModal}
						>&times;</button
					>
				</div>

				<div class="p-6">
					<div class="mb-6 text-center">
						<svg
							class="mx-auto mb-4 h-16 w-16 text-red-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							></path>
						</svg>

						<p class="mb-2 text-lg font-medium">Are you sure?</p>
						<p class="text-gray-600">
							You are about to delete user <strong>{userToDelete.name}</strong> with ID:
							<strong>{userToDelete.id}</strong>. This action cannot be undone.
						</p>
					</div>

					{#if deleteError}
						<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
							<p>{deleteError}</p>
						</div>
					{/if}

					<div class="mt-6 flex justify-end gap-3">
						<button
							type="button"
							class="rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
							on:click={closeDeleteModal}
							disabled={deleteInProgress}
						>
							Cancel
						</button>
						<button
							type="button"
							class="rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-400"
							on:click={deleteUser}
							disabled={deleteInProgress}
						>
							{deleteInProgress ? 'Deleting...' : 'Delete'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
