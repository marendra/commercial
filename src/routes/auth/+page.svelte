<script lang="ts">
	 import { onMount } from 'svelte';
	 import {auth} from '$lib/firebaseclient';
	 import { isSignInWithEmailLink, signInWithEmailLink, type UserCredential } from 'firebase/auth';
    import { goto } from '$app/navigation';

		let isLoading:boolean = false;
		let error:string = '';
		let message:string = '';

		onMount( async ()=>{
			isLoading = true;
			  try {
            // Check if the current URL is a valid email sign-in link
            if (isSignInWithEmailLink(auth, window.location.href)) {
                let email: string | null = localStorage.getItem('emailForSignIn');

                if (!email) {
                    email = prompt('Please provide your email for confirmation:');
                    if (!email) {
                        error = 'Email is required to complete sign-in.';
                        isLoading = false;
                        return;
                    }
                }

                const userCredential: UserCredential = await signInWithEmailLink(auth, email, window.location.href);
                const user = userCredential.user;

                console.log('Successfully signed in:', user);

                localStorage.removeItem('emailForSignIn');

                message = 'Sign-in successful! Redirecting...';
                await goto('/dashboard');
            } else {
                error = 'Invalid or expired sign-in link. Please try signing in again.';
            }
        } catch (err: any) {
            console.error('Error completing sign-in:', err);

            if (err.code === 'auth/invalid-action-code') {
                error = 'The sign-in link is invalid or has expired.';
            } else if (err.code === 'auth/email-already-in-use') {
                 error = 'This email is already associated with an account. Please sign in normally.';
            } else if (err.code === 'auth/credential-already-in-use') {
                 error = 'This email is already linked to another account (e.g., Google). Please sign in using that method.';
            }
            else {
                error = err.message || 'An unknown error occurred during sign-in.';
            }
        } finally {
            isLoading = false;
        }
		})
</script>
<div class="h-screen text-center flex flex-col justify-center items-center w-full">
	<p class="text-2xl font-light">{message}</p>
	<p class="mt-4">{error}</p>
</div>
