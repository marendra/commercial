<script lang="ts">
	import '../app.css';
 import {auth} from '$lib/firebaseclient';
 import { onAuthStateChanged,signOut ,type User} from 'firebase/auth';
 import {onMount} from 'svelte';
	import { goto } from '$app/navigation';
import {browser} from '$app/environment';

	let { children } = $props();
	let user:User|null = null;
	let loading:boolean = true;

	onMount(async() => {

		onAuthStateChanged(auth,(currentUser:User|null)=>{
			const currentPath = window.location.pathname;
		user = currentUser;

		if (!user) {


			if (currentPath !== "/signin" && currentPath !== "/auth") {
				goto("/signin");
			}

		} else {
			if (currentPath=="/"){
				goto("/dashboard")
			}
		}
	})
	})



</script>

{@render children()}
