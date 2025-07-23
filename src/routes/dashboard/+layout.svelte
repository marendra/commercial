<script lang="ts">
  import wnts from "$lib/assets/wnts.png";
		import '../../app.css';
  const IMAGE_WIDTH = 40;
  const IMAGE_HEIGHT = 40;
  let { children } = $props();
</script>

<div class="flex flex-col h-screen w-full ">
  <header class="mx-4 mt-4 flex flex-row justify-between bg-white items-center shadow-md p-4 rounded-2xl">

    <div class="flex flex-row justify-between items-center">
      <img src={wnts} alt="wnts"  class="w-18 h-18 object-contain" />
       <a href="/dashboard/ocr" class="ml-12 hover:text-blue-600" >
        ORF Flow Computer OCR
      </a>
    </div>
    <div>

    </div>
  </header>

  <div class="flex-1 p-8">
    {@render children()}
  </div>
</div>