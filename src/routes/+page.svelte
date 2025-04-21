<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// src/types/auth.ts

	interface UserData {
		id: number;
		name: string;
		email: string;
		phone: string | null;
		email_verified_at: string;
		created_at: string;
		updated_at: string;
		role: string;
		token: string;
	}

	interface LoginResponse {
		success: boolean;
		data: UserData | { error: string };
		message: string;
	}

	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let rememberMe = false;

	async function handleLogin() {
		if (!email || !password) {
			error = 'Email dan password harus diisi.';
			return;
		}

		try {
			loading = true;
			error = '';

			const response = await fetch('http://localhost:8000/api/login-admin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			});

			const result = await response.json();

			if (result.success) {
				// Simpan token ke localStorage atau sessionStorage
				if (rememberMe) {
					localStorage.setItem('auth_token', result.data.token);
					localStorage.setItem('user', JSON.stringify(result.data));
				} else {
					sessionStorage.setItem('auth_token', result.data.token);
					sessionStorage.setItem('user', JSON.stringify(result.data));
				}

				// Kirim token ke server untuk disimpan sebagai cookie juga
				await fetch('/api/auth/login', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ token: result.data.token })
				});

				// Redirect ke dashboard
				goto('/dashboard');
			} else {
				error = result.data?.error || result.message || 'Login gagal.';
			}
		} catch (err) {
			console.error('Login error:', err);
			error = 'Terjadi kesalahan saat mencoba login. Silakan coba lagi.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// Focus pada input email saat halaman dimuat
		const emailInput = document.getElementById('email');
		if (emailInput) emailInput.focus();
	});
</script>

<svelte:head>
	<title>Login Admin</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Admin Login</h2>
		<p class="mt-2 text-center text-sm text-gray-600">Masuk ke dashboard admin</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			<form class="space-y-6" on:submit|preventDefault={handleLogin}>
				{#if error}
					<div class="border-l-4 border-red-400 bg-red-50 p-4">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg
									class="h-5 w-5 text-red-400"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm text-red-700">
									{error}
								</p>
							</div>
						</div>
					</div>
				{/if}

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700"> Email </label>
					<div class="mt-1">
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={email}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="admin@example.com"
						/>
					</div>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
					<div class="mt-1">
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							bind:value={password}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="••••••••"
						/>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<input
							id="remember_me"
							name="remember_me"
							type="checkbox"
							bind:checked={rememberMe}
							class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
						/>
						<label for="remember_me" class="ml-2 block text-sm text-gray-900"> Ingat saya </label>
					</div>

					<div class="text-sm">
						<a href="/forgot-password" class="font-medium text-indigo-600 hover:text-indigo-500">
							Lupa password?
						</a>
					</div>
				</div>

				<div>
					<button
						type="submit"
						disabled={loading}
						class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if loading}
							<svg
								class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Memproses...
						{:else}
							Masuk
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
