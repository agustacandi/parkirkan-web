<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { isLoggedIn } from '$lib/auth';
	import Logout from '$lib/components/Logout.svelte';
	import { page } from '$app/stores';

	// Menu toggle untuk mobile
	let isMenuOpen = false;
	const toggleMenu = () => (isMenuOpen = !isMenuOpen);

	// Cek path saat ini untuk menentukan navigasi yang aktif
	$: currentPath = $page.url.pathname;
	$: isActive = (path) => currentPath.startsWith(path);

	onMount(() => {
		// Double check client-side apakah user sudah login
		if (!isLoggedIn()) {
			goto('/');
		}
	});
</script>

<div class="min-h-screen bg-gray-100">
	<nav class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<span class="text-xl font-bold text-gray-800">Admin Dashboard</span>
					</div>

					<!-- Navigation untuk desktop -->
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a
							href="/dashboard"
							class="{isActive('/dashboard') && !isActive('/dashboard/')
								? 'border-indigo-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
						>
							Dashboard
						</a>
						<a
							href="/dashboard/users"
							class="{isActive('/dashboard/users')
								? 'border-indigo-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
						>
							Users
						</a>
						<a
							href="/dashboard/parking-history"
							class="{isActive('/dashboard/parking-history')
								? 'border-indigo-500 text-gray-900'
								: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
						>
							Parking History
						</a>
					</div>
				</div>

				<div class="flex items-center">
					<Logout />

					<!-- Mobile menu button -->
					<div class="ml-4 flex items-center sm:hidden">
						<button
							on:click={toggleMenu}
							type="button"
							class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:ring-inset"
							aria-expanded="false"
						>
							<span class="sr-only">Open main menu</span>
							<!-- Icon when menu is closed -->
							{#if !isMenuOpen}
								<svg
									class="block h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6h16M4 12h16M4 18h16"
									/>
								</svg>
							{:else}
								<!-- Icon when menu is open -->
								<svg
									class="block h-6 w-6"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Mobile menu, show/hide based on menu state -->
		{#if isMenuOpen}
			<div class="sm:hidden">
				<div class="space-y-1 pt-2 pb-3">
					<a
						href="/dashboard"
						class="{isActive('/dashboard') && !isActive('/dashboard/')
							? 'border-indigo-500 bg-indigo-50 text-indigo-700'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'} block border-l-4 py-2 pr-4 pl-3 text-base font-medium"
					>
						Dashboard
					</a>
					<a
						href="/dashboard/users"
						class="{isActive('/dashboard/users')
							? 'border-indigo-500 bg-indigo-50 text-indigo-700'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'} block border-l-4 py-2 pr-4 pl-3 text-base font-medium"
					>
						Users
					</a>
					<a
						href="/dashboard/parking-history"
						class="{isActive('/dashboard/parking-history')
							? 'border-indigo-500 bg-indigo-50 text-indigo-700'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'} block border-l-4 py-2 pr-4 pl-3 text-base font-medium"
					>
						Parking History
					</a>
				</div>
			</div>
		{/if}
	</nav>

	<div class="py-6">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
			<slot />
		</div>
	</div>
</div>
