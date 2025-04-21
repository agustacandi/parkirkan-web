<script lang="ts">
	import { goto } from '$app/navigation';
	import { logout } from '$lib/auth';

	async function handleLogout() {
		// Hapus data dari localStorage/sessionStorage
		logout();

		// Kirim request ke server untuk hapus cookie
		await fetch('/api/auth/logout', { method: 'POST' });

		// Redirect ke halaman login
		goto('/');
	}
</script>

<button on:click={handleLogout} class="text-sm font-medium text-red-600 hover:text-red-500">
	Logout
</button>
