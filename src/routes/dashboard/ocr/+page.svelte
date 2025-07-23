<script>
	import {storage} from '$lib/firebaseclient.js';
	import FileUploadButton from '$lib/components/FileUploadButton.svelte';
</script>

<div class="w-full h-full flex flex-col items-center">

<div class="flex flex-col justify-center text-center ">
	<p class="text-xl mb-8">Flow Computer ORF Uploader</p>
	<FileUploadButton/>

</div>

</div>