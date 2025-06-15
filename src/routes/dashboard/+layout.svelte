<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { isLoggedIn } from '$lib/auth';
	import Logout from '$lib/components/Logout.svelte';
	import { page } from '$app/stores';
	import { ROUTES } from '$lib/constants/config';
	import { slide, fade, fly } from 'svelte/transition';
	import { quintOut, elasticOut } from 'svelte/easing';

	// Tabler Icons
	import {
		IconDashboard,
		IconUsers,
		IconClipboardList,
		IconLock,
		IconUser,
		IconMenu2,
		IconX
	} from '@tabler/icons-svelte';

	// Sidebar state
	let isSidebarOpen = false;

	// Reactive values for navigation state
	$: currentPath = $page.url.pathname;
	$: isDashboardRoot = currentPath === ROUTES.DASHBOARD;
	$: isUsersPage = currentPath.startsWith(ROUTES.DASHBOARD_USERS);
	$: isParkingHistoryPage = currentPath.startsWith(ROUTES.DASHBOARD_PARKING_HISTORY);

	// Navigation items with Tabler Icons
	const navigationItems = [
		{
			name: 'Dashboard',
			href: ROUTES.DASHBOARD,
			icon: IconDashboard,
			isActive: isDashboardRoot
		},
		{
			name: 'Users',
			href: ROUTES.DASHBOARD_USERS,
			icon: IconUsers,
			isActive: isUsersPage
		},
		{
			name: 'Parking History',
			href: ROUTES.DASHBOARD_PARKING_HISTORY,
			icon: IconClipboardList,
			isActive: isParkingHistoryPage
		}
	];

	/**
	 * Toggle sidebar for mobile with haptic feedback
	 */
	function toggleSidebar(): void {
		isSidebarOpen = !isSidebarOpen;

		// Add haptic feedback if available
		if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
			navigator.vibrate(50);
		}
	}

	/**
	 * Close sidebar
	 */
	function closeSidebar(): void {
		isSidebarOpen = false;
	}

	/**
	 * Handle navigation with sidebar closure on mobile
	 */
	function handleNavigation(path: string) {
		return () => {
			closeSidebar();
			goto(path);
		};
	}

	/**
	 * Handle click outside to close sidebar on mobile
	 */
	function handleClickOutside(event: MouseEvent): void {
		const target = event.target as Element;
		if (
			isSidebarOpen &&
			!target.closest('[data-sidebar]') &&
			!target.closest('[data-sidebar-button]')
		) {
			closeSidebar();
		}
	}

	// Cleanup functions storage
	let cleanupFunctions: (() => void)[] = [];

	onMount(() => {
		// Client-side authentication check
		if (!isLoggedIn()) {
			goto(ROUTES.HOME);
			return;
		}

		// Add click outside listener for sidebar
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isSidebarOpen) {
				closeSidebar();
			}
		};

		// Add event listeners only in browser environment
		if (typeof document !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleEscapeKey);

			// Store cleanup functions
			cleanupFunctions = [
				() => document.removeEventListener('click', handleClickOutside),
				() => document.removeEventListener('keydown', handleEscapeKey)
			];
		}

		// Return cleanup function
		return () => {
			cleanupFunctions.forEach((cleanup) => cleanup());
			cleanupFunctions = [];
		};
	});

	onDestroy(() => {
		// Additional cleanup in case onMount cleanup doesn't run
		if (typeof document !== 'undefined') {
			cleanupFunctions.forEach((cleanup) => cleanup());
			cleanupFunctions = [];
		}
	});
</script>

<div class="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
	<!-- Desktop Sidebar -->
	<div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
		<div
			class="flex grow flex-col gap-y-5 overflow-y-auto bg-white/80 px-6 pb-4 ring-1 ring-gray-900/5 backdrop-blur-md"
		>
			<!-- Logo -->
			<div class="flex h-16 shrink-0 items-center">
				<div class="flex items-center space-x-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg"
					>
						<IconLock class="h-6 w-6 text-white" />
					</div>
					<div>
						<span
							class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-xl font-bold text-transparent"
							>Parkirkan</span
						>
						<p class="text-xs text-gray-500">Admin Dashboard</p>
					</div>
				</div>
			</div>

			<!-- Navigation -->
			<nav class="flex flex-1 flex-col">
				<ul role="list" class="flex flex-1 flex-col gap-y-7">
					<li>
						<ul role="list" class="-mx-2 space-y-1">
							{#each navigationItems as item}
								<li>
									<a
										href={item.href}
										class="{item.isActive
											? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
											: 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'} group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all duration-200"
									>
										<svelte:component
											this={item.icon}
											class="{item.isActive
												? 'text-blue-600'
												: 'text-gray-400 group-hover:text-blue-600'} h-6 w-6 shrink-0 transition-colors duration-200"
										/>
										{item.name}
									</a>
								</li>
							{/each}
						</ul>
					</li>

					<!-- User section -->
					<li class="mt-auto">
						<div
							class="rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-4 ring-1 ring-gray-200"
						>
							<div class="flex items-center gap-x-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600"
								>
									<IconUser class="h-4 w-4 text-white" />
								</div>
								<div class="flex-1">
									<p class="text-sm font-semibold text-gray-900">Administrator</p>
									<p class="text-xs text-gray-500">Admin Panel</p>
								</div>
							</div>
							<div class="mt-3">
								<Logout />
							</div>
						</div>
					</li>
				</ul>
			</nav>
		</div>
	</div>

	<!-- Mobile sidebar -->
	{#if isSidebarOpen}
		<div
			class="relative z-50 lg:hidden"
			role="dialog"
			aria-modal="true"
			transition:fade={{ duration: 300, easing: quintOut }}
		>
			<!-- Background overlay -->
			<div
				class="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
				transition:fade={{ duration: 300 }}
			></div>

			<div class="fixed inset-0 flex">
				<div
					class="relative mr-16 flex w-full max-w-xs flex-1"
					data-sidebar
					transition:slide={{ duration: 400, easing: elasticOut }}
				>
					<!-- Close button -->
					<div class="absolute left-full top-0 flex w-16 justify-center pt-5">
						<button
							type="button"
							class="-m-2.5 rounded-lg p-2.5 transition-all duration-200 hover:scale-110 hover:bg-white/10 active:scale-95"
							on:click={closeSidebar}
							aria-label="Close sidebar"
							transition:fly={{ x: 50, duration: 300, delay: 200 }}
						>
							<IconX class="h-6 w-6 text-white transition-transform duration-200 hover:rotate-90" />
						</button>
					</div>

					<!-- Sidebar content -->
					<div
						class="flex grow flex-col gap-y-5 overflow-y-auto bg-white/90 px-6 pb-4 ring-1 ring-gray-900/10 backdrop-blur-md"
					>
						<!-- Logo -->
						<div
							class="flex h-16 shrink-0 items-center"
							transition:fly={{ y: -30, duration: 400, delay: 100 }}
						>
							<div class="flex items-center space-x-3">
								<div
									class="flex h-10 w-10 transform items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg transition-transform duration-200 hover:scale-110"
								>
									<IconLock class="h-6 w-6 text-white" />
								</div>
								<div>
									<span
										class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-xl font-bold text-transparent"
										>Parkirkan</span
									>
									<p class="text-xs text-gray-500">Admin Dashboard</p>
								</div>
							</div>
						</div>

						<!-- Navigation -->
						<nav class="flex flex-1 flex-col">
							<ul role="list" class="flex flex-1 flex-col gap-y-7">
								<li>
									<ul role="list" class="-mx-2 space-y-1">
										{#each navigationItems as item, index}
											<li
												transition:fly={{
													x: -50,
													duration: 300,
													delay: 150 + index * 75,
													easing: quintOut
												}}
											>
												<a
													href={item.href}
													on:click={closeSidebar}
													class="{item.isActive
														? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
														: 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'} group flex gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
												>
													<svelte:component
														this={item.icon}
														class="{item.isActive
															? 'text-blue-600'
															: 'text-gray-400 group-hover:text-blue-600'} h-6 w-6 shrink-0 transition-all duration-200 group-hover:scale-110"
													/>
													{item.name}
												</a>
											</li>
										{/each}
									</ul>
								</li>

								<!-- User section -->
								<li class="mt-auto" transition:fly={{ y: 50, duration: 400, delay: 300 }}>
									<div
										class="rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-4 ring-1 ring-gray-200 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
									>
										<div class="flex items-center gap-x-3">
											<div
												class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 transition-transform duration-200 hover:scale-110"
											>
												<IconUser class="h-4 w-4 text-white" />
											</div>
											<div class="flex-1">
												<p class="text-sm font-semibold text-gray-900">Administrator</p>
												<p class="text-xs text-gray-500">Admin Panel</p>
											</div>
										</div>
										<div class="mt-3">
											<Logout />
										</div>
									</div>
								</li>
							</ul>
						</nav>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main content -->
	<div class="w-full lg:pl-72">
		<!-- Top bar for mobile -->
		<div
			class="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200/50 bg-white/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:hidden"
		>
			<button
				type="button"
				class="-m-2.5 rounded-lg p-2.5 text-gray-700 transition-all duration-200 hover:scale-110 hover:bg-gray-100 active:scale-95 lg:hidden {isSidebarOpen
					? 'scale-95 bg-gray-100'
					: ''}"
				on:click={toggleSidebar}
				data-sidebar-button
				aria-label="Open sidebar"
			>
				<IconMenu2
					class="h-6 w-6 transition-transform duration-300 {isSidebarOpen
						? 'rotate-90 scale-110'
						: 'hover:rotate-12'}"
				/>
			</button>

			<!-- Mobile logo -->
			<div class="flex items-center space-x-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 transition-transform duration-200 hover:scale-110"
				>
					<IconLock class="h-4 w-4 text-white" />
				</div>
				<span
					class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-lg font-bold text-transparent"
					>Parkirkan</span
				>
			</div>
		</div>

		<!-- Page content -->
		<main class="py-4 sm:py-6 lg:py-8">
			<div class="px-4 sm:px-6 lg:px-8">
				<slot />
			</div>
		</main>
	</div>
</div>
