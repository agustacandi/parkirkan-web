<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { storeAuthData } from '$lib/auth';
	import { apiRequest, validateRequiredFields } from '$lib/utils/api';
	import { API_CONFIG, ROUTES, UI_CONFIG } from '$lib/constants/config';
	import type { LoginResponse, UserData, ApiError } from '$lib/types/auth';

	// Component state
	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let rememberMe = false;

	// Cleanup references
	let emailInputRef: HTMLInputElement;
	let errorTimeoutId: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Enhanced login handler with proper error handling and validation
	 */
	async function handleLogin(): Promise<void> {
		// Clear previous error
		clearError();

		// Validate required fields
		const validation = validateRequiredFields({ email, password }, ['email', 'password']);
		if (!validation.isValid) {
			setError(`Kolom berikut harus diisi: ${validation.missingFields.join(', ')}`);
			return;
		}

		// Email format validation
		if (!isValidEmail(email)) {
			setError('Format email tidak valid.');
			return;
		}

		try {
			loading = true;

			// Make API request with proper error handling
			const result = await apiRequest<LoginResponse>(API_CONFIG.ENDPOINTS.LOGIN_ADMIN, {
				method: 'POST',
				body: JSON.stringify({ email, password })
			});

			if (result.success && 'token' in result.data) {
				const userData = result.data as UserData;

				// Store authentication data using improved utility
				const stored = storeAuthData(userData.token, userData, rememberMe);
				if (!stored) {
					setError('Gagal menyimpan data autentikasi. Silakan coba lagi.');
					return;
				}

				// Redirect to intended page or dashboard
				const redirectTo = $page.url.searchParams.get('redirect') || ROUTES.DASHBOARD;
				await goto(redirectTo);
			} else {
				const errorData = result.data as { error: string };
				setError(errorData.error || result.message || 'Login gagal.');
			}
		} catch (err) {
			console.error('Login error:', err);
			const apiError = err as ApiError;

			if (apiError.code === 'TIMEOUT') {
				setError('Koneksi timeout. Silakan coba lagi.');
			} else if (apiError.code === 'NETWORK_ERROR') {
				setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
			} else if (apiError.status === 401) {
				setError('Email atau password salah.');
			} else if (apiError.status === 429) {
				setError('Terlalu banyak percobaan login. Silakan tunggu sebentar.');
			} else {
				setError(apiError.message || 'Terjadi kesalahan saat login. Silakan coba lagi.');
			}
		} finally {
			loading = false;
		}
	}

	/**
	 * Set error with auto-clear timeout
	 */
	function setError(message: string): void {
		error = message;
		clearErrorTimeout();
		errorTimeoutId = setTimeout(() => {
			error = '';
		}, UI_CONFIG.ERROR_DISPLAY_TIME);
	}

	/**
	 * Clear error and timeout
	 */
	function clearError(): void {
		error = '';
		clearErrorTimeout();
	}

	/**
	 * Clear error timeout
	 */
	function clearErrorTimeout(): void {
		if (errorTimeoutId !== null) {
			clearTimeout(errorTimeoutId);
			errorTimeoutId = null;
		}
	}

	/**
	 * Basic email validation
	 */
	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	/**
	 * Focus email input with error handling
	 */
	function focusEmailInput(): void {
		if (emailInputRef) {
			try {
				emailInputRef.focus();
			} catch (error) {
				console.warn('Could not focus email input:', error);
			}
		}
	}

	onMount(() => {
		// Add small delay to ensure DOM is ready
		setTimeout(focusEmailInput, 100);
	});

	onDestroy(() => {
		// Cleanup timeouts to prevent memory leaks
		clearErrorTimeout();
	});
</script>

<svelte:head>
	<title>Parkirkan Web - Login Admin</title>
</svelte:head>

<div class="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
	<div
		class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24"
	>
		<div class="mx-auto w-full max-w-sm lg:w-96">
			<!-- Logo and Header -->
			<div class="text-center">
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg"
				>
					<svg class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
				</div>
				<h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">Parkirkan Admin</h2>
				<p class="mt-2 text-sm text-gray-600">Sign in to administrator dashboard</p>
			</div>

			<div class="mt-8">
				<div class="rounded-xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5">
					<form class="space-y-6" on:submit|preventDefault={handleLogin}>
						{#if error}
							<div class="rounded-lg border border-red-200 bg-red-50 p-4">
								<div class="flex">
									<div class="flex-shrink-0">
										<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
									<div class="ml-3">
										<p class="text-sm font-medium text-red-800">{error}</p>
									</div>
								</div>
							</div>
						{/if}

						<div class="space-y-5">
							<div>
								<label for="email" class="block text-sm font-medium leading-6 text-gray-900"
									>Email</label
								>
								<div class="mt-2">
									<input
										bind:this={emailInputRef}
										id="email"
										name="email"
										type="email"
										autocomplete="email"
										required
										bind:value={email}
										class="block w-full rounded-lg border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
										placeholder="admin@example.com"
									/>
								</div>
							</div>

							<div>
								<label for="password" class="block text-sm font-medium leading-6 text-gray-900"
									>Password</label
								>
								<div class="mt-2">
									<input
										id="password"
										name="password"
										type="password"
										autocomplete="current-password"
										required
										bind:value={password}
										class="block w-full rounded-lg border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-all duration-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
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
										class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
									/>
									<label for="remember_me" class="ml-3 block text-sm leading-6 text-gray-700"
										>Remember me</label
									>
								</div>
							</div>

							<div>
								<button
									type="submit"
									disabled={loading}
									class="flex w-full justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#if loading}
										<svg
											class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
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
										Signing in...
									{:else}
										Sign in to Dashboard
									{/if}
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>

	<!-- Right side with decorative image -->
	<div class="relative hidden w-0 flex-1 lg:block">
		<div
			class="absolute inset-0 h-full w-full bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500"
		>
			<div class="absolute inset-0 bg-black/20"></div>
			<div class="relative flex h-full items-center justify-center">
				<div class="text-center text-white">
					<div class="mx-auto mb-8 h-24 w-24 rounded-full bg-white/20 p-6 backdrop-blur-sm">
						<svg class="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold">Parking Management System</h3>
					<p class="mt-4 text-lg text-blue-100">Manage all parking data easily and efficiently</p>
				</div>
			</div>
		</div>
	</div>
</div>
