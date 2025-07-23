<script lang="ts">
  import {storage} from '$lib/firebaseclient';
  import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
  import { createEventDispatcher } from 'svelte';
  import * as XLSX from 'xlsx'; // Import the Excel library

  // Props
  export let folderPath: string = 'commercial/';
  export let acceptedFileTypes: string = 'application/pdf';
  export let uploadButtonText: string = 'Upload PDF';
  export let disabled: boolean = false;

  // Reactive State
  let fileInput: HTMLInputElement;
  let isUploading: boolean = false;
  let uploadProgress: number = 0;
  let uploadError: string | null = null;
  let uploadedFileUrl: string | null = null;
  let uploadedFileName: string | null = null;
  let showUploadFeedback: boolean = false;
  let isConverting: boolean = false;
  let conversionError: string | null = null;
  let convertedJsonData: any | null = null;

  const dispatch = createEventDispatcher();

  function triggerFileInput() {
    if (!isUploading && !disabled) {
      fileInput.click();
    }
  }

  async function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    const timestamp = Date.now();
    const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
    const extension = file.name.split('.').pop();
    const newFileName = `${originalName}_${timestamp}.${extension}`;

    isUploading = true;
    uploadProgress = 0;
    uploadError = null;
    uploadedFileUrl = null;
    uploadedFileName = newFileName;
    showUploadFeedback = true;
    isConverting = false;
    conversionError = null;
    convertedJsonData = null;

    try {
      const storageRef = ref(storage, `${folderPath}${newFileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          uploadProgress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          dispatch('uploadProgress', { name: newFileName, progress: uploadProgress });
        },
        (error) => {
          console.error("Upload failed:", error);
          uploadError = error.message;
          isUploading = false;
          dispatch('uploadError', { name: newFileName, error: error.message });
        },
        async () => {
          try {
            uploadedFileUrl = await getDownloadURL(uploadTask.snapshot.ref);
            isUploading = false;
            dispatch('uploadSuccess', {
              name: newFileName,
              url: uploadedFileUrl,
              path: uploadTask.snapshot.ref.fullPath
            });
            if (fileInput) fileInput.value = '';
          } catch (urlError) {
            console.error("Failed to get download URL:", urlError);
            uploadError = "Failed to get download URL.";
            isUploading = false;
            dispatch('uploadError', { name: newFileName, error: "Failed to get download URL." });
          }
        }
      );
    } catch (uploadInitialError) {
      console.error("Initial upload setup failed:", uploadInitialError);
      isUploading = false;
      dispatch('uploadError', { name: newFileName});
    }
  }

  async function convertPdfToJson() {
    if (!uploadedFileUrl || isConverting || !uploadedFileName) return;

    isConverting = true;
    conversionError = null;
    convertedJsonData = null;
    showUploadFeedback = true;

    const apiUrl = '/api/convert';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: [uploadedFileName] })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `API Error ${response.status}`);

      convertedJsonData = data;
      conversionError = null;
    } catch (error: any) {
      console.error("Conversion API call failed:", error);
      conversionError = error.message;
      convertedJsonData = null;
    } finally {
      isConverting = false;
    }
  }

  // START: NEW EXCEL EXPORT FUNCTION
  function exportToExcel() {
    if (!convertedJsonData?.report) return;

    const reportData = convertedJsonData.report;
    const date = reportData[0]?.date || 'Report';

    // 1. Prepare data in an array-of-arrays format
    const sheetData = [
      [date, null, null], // Title row
      [], // Spacer row
      ["Period", "Energy 3 hourly total data", null], // Merged header row 1
      [null, "BBTU", "MMSCF"], // Header row 2
    ];

    // 2. Add the data rows
    reportData.forEach((item, i) => {
      const startTime = item.periodStart;
      const endTime = (i < reportData.length - 1) ? reportData[i + 1].periodStart : '00:00';
      sheetData.push([
        `${startTime} - ${endTime}`,
        item.energyTotal,
        item.svolTotal
      ]);
    });

    // 3. Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();

    // 4. Define the merged cells to match the table structure
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Merge A1:C1 for the date
      { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } }, // Merge B3:C3 for "Energy..."
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } }  // Merge A3:A4 for "Period"
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    // 5. Trigger the download
    XLSX.writeFile(wb, `Report_${date}.xlsx`);
  }
  // END: NEW EXCEL EXPORT FUNCTION
</script>

<div class="relative w-full flex flex-wrap justify-center items-center gap-4">
<input
    type="file"
    bind:this={fileInput}
    on:change={handleFileChange}
    accept={acceptedFileTypes}
    class="hidden"
  />

  <button
    on:click={triggerFileInput}
    disabled={isUploading || disabled || isConverting}
    class="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-200 flex items-center justify-center space-x-2 min-w-[150px] {isUploading || disabled || isConverting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}"
  >
    {#if isUploading}
      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <span>Uploading {uploadProgress}%</span>
    {:else}
      <span>{uploadButtonText}</span>
    {/if}
  </button>

  <button
    on:click={convertPdfToJson}
    disabled={!uploadedFileUrl || isConverting || isUploading || disabled}
    class="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-200 flex items-center justify-center space-x-2 min-w-[150px] {isConverting || !uploadedFileUrl || isUploading || disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}"
  >
    {#if isConverting}
      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <span>Converting...</span>
    {:else}
      <span>Convert to JSON</span>
    {/if}
  </button>

  {#if convertedJsonData}
    <button
      on:click={exportToExcel}
      class="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-200 flex items-center justify-center space-x-2 min-w-[150px] bg-teal-600 hover:bg-teal-700"
    >
      <span>Export to Excel</span>
    </button>
  {/if}
  {#if showUploadFeedback}
  <div class="w-full mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
    {#if uploadError}
      <p class="text-red-500 text-sm">Upload Error: {uploadError}</p>
    {:else if uploadedFileUrl && !isUploading}
      <p class="text-green-600 text-sm">PDF Uploaded: {uploadedFileName}</p>
    {:else if isUploading}
      <p class="text-blue-600 text-sm">Uploading PDF...</p>
    {/if}

    {#if isConverting}
      <p class="text-purple-600 text-sm mt-2">Conversion in progress...</p>
    {:else if conversionError}
      <p class="text-red-500 text-sm mt-2">Conversion Error: {conversionError}</p>
    {:else if convertedJsonData}
      <p class="text-green-600 text-sm mt-2">Conversion Complete! ✅</p>

      {#if convertedJsonData.report && convertedJsonData.report.length > 0}
      <div class="mt-4 w-full">
        <h3 class="text-center font-semibold mb-2 text-gray-800">
            {convertedJsonData.report[0].date}
        </h3>
        <div class="overflow-x-auto rounded-lg border border-gray-300">
            <table class="min-w-full bg-white text-sm text-center">
                <thead class="bg-yellow-200 font-semibold">
                    <tr>
                        <th rowspan="2" class="p-2 border-r border-gray-300 align-middle">Period</th>
                        <th colspan="2" class="p-2 border-b border-gray-300">Energy 3 hourly total data</th>
                    </tr>
                    <tr>
                        <th class="p-2 border-r border-gray-300 font-semibold">BBTU</th>
                        <th class="p-2 font-semibold">MMSCF</th>
                    </tr>
                </thead>
                <tbody>
                    {#each convertedJsonData.report as item, i (i)}
                      {@const startTime = item.periodStart}
                      {@const endTime = (i < convertedJsonData.report.length - 1) ? convertedJsonData.report[i + 1].periodStart : '00:00'}
                        <tr class="border-t border-gray-200">
                            <td class="p-2 border-r border-gray-300">{startTime} - {endTime}</td>
                            <td class="p-2 border-r border-gray-300 text-blue-600">{item.energyTotal}</td>
                            <td class="p-2 text-blue-600">{item.svolTotal}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
      </div>
      {/if}

      <details class="mt-4 text-gray-700 text-xs">
        <summary class="cursor-pointer text-blue-700 hover:underline">View Raw JSON Data</summary>
        <pre class="bg-gray-100 p-2 rounded-md overflow-x-auto mt-1 text-black text-[10px] sm:text-xs">
          <code>{JSON.stringify(convertedJsonData, null, 2)}</code>
        </pre>
      </details>
    {/if}
  </div>
  {/if}
</div>