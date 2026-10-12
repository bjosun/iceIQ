// Sparar eller delar en textfil. På webben laddas den ned; i iPhone-appen (där
// nedladdning av blobbar inte fungerar) skrivs den till cachen och delas via
// telefonens delningsblad (Filer, AirDrop, Mejl ...).
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNativeApp } from './platform';

export async function saveTextFile(fileName: string, text: string, mime = 'application/json'): Promise<void> {
  if (isNativeApp) {
    const written = await Filesystem.writeFile({
      path: fileName,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: fileName, files: [written.uri] });
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
