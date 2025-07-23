<script lang="ts">
	import wnts from "$lib/assets/wnts.png"
	import {browser} from '$app/environment';
	import { sendSignInLinkToEmail, type ActionCodeSettings } from 'firebase/auth';
	import {auth} from '$lib/firebaseclient';
  import Icon from "@iconify/svelte";
	let email: string=""
	let message: string=""
	let error: string=""
	let isLoading: boolean = false;


	async function signIn(){
				message = '';
        error = '';
        isLoading = true;
				const actionCodeSettings = getActionCodeSettings();
        if (!actionCodeSettings) {
            error = 'Application not running in a browser environment. Cannot send link.';
            isLoading = false;
            return;
        }

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            localStorage.setItem('emailForSignIn', email); // localStorage also needs browser check implicitly

            message = `A sign-in link has been sent to ${email}. Please check your inbox.`;
            email = '';
        } catch (err: any) {
            console.error('Error sending sign-in link:', err);
            error = err.message || 'An unknown error occurred.';
        } finally {
            isLoading = false;
        }

	}

	  function getActionCodeSettings(): ActionCodeSettings | null {
        if (browser) {
            return {
                url: window.location.origin + '/auth',
                handleCodeInApp: true,
            };
        }
        return null; // Return null if not in browser
    }
</script>


<div class="h-screen flex flex-col w-full items-center ">
 <div class="flex flex-col text-center items-center w-1/4  shadow-2xl p-8 mt-12">
	 <img class="h-32 w-32" src={wnts} alt="wnts"/>
	 <p class="mt-4">Please provider your MedcoEnergi Email to Enter</p>
	 <input bind:value={email} type="email" placeholder="E-mail" class="w-full mt-4 rounded"/>
	 <button class="w-full mt-4 bg-blue-500  font-bold py-2 px-4 rounded text-white" on:click={signIn} disabled={isLoading}>
		 {#if isLoading}
				<Icon icon="line-md:loading-alt-loop" className="animate-spin"/>
			 {:else}
		 Submit
			 {/if}
	 </button>
	 <p class="mt-4 text-red-500">{error}</p>
 </div>
</div>