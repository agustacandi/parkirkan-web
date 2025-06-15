<script lang="ts">
	import { goto } from '$app/navigation';
	import { logout } from '$lib/auth';
	import { ROUTES } from '$lib/constants/config';

	let loading = false;

	/**
	 * Enhanced logout handler with proper error handling
	 */
	async function handleLogout(): Promise<void> {
		if (loading) return; // Prevent double-click

		try {
			loading = true;

			// Clear client-side authentication data first
			logout();

			// Attempt to clear server-side cookie
			try {
				await fetch(ROUTES.API_AUTH_LOGOUT, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				});
			} catch (error) {
				// Log error but don't prevent logout since client data is already cleared
				console.warn('Failed to clear server session:', error);
			}

			// Redirect to login page
			await goto(ROUTES.HOME);
		} catch (error) {
			console.error('Logout error:', error);
			// Even if there's an error, still redirect to login as a fallback
			await goto(ROUTES.HOME);
		} finally {
			loading = false;
		}
	}
</script>

<button
	on:click={handleLogout}
	disabled={loading}
	class="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
	aria-label="Logout from application"
>
	{#if loading}
		<svg class="mr-2 h-4 w-4 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
		Signing out...
	{:else}
		<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
			/>
		</svg>
		Sign out
	{/if}
</button>
