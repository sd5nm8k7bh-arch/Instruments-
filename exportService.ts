
import JSZip from 'jszip';

const FILES_TO_EXPORT = [
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'metadata.json',
  'manifest.json',
  'package.json',
  'components/GuitarString.tsx',
  'components/Controls.tsx',
  'services/audioEngine.ts',
  'services/geminiService.ts',
  'services/exportService.ts'
];

export async function downloadSourceCode() {
  const zip = new JSZip();
  
  const loadingPromises = FILES_TO_EXPORT.map(async (path) => {
    try {
      const response = await fetch(`./${path}`);
      if (response.ok) {
        const content = await response.text();
        zip.file(path, content);
      }
    } catch (err) {
      console.error(`Errore nel caricamento di ${path}:`, err);
    }
  });

  await Promise.all(loadingPromises);
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'multistudio-pro-source.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
