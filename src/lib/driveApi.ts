import { getAccessToken, googleSignIn } from './googleAuth';

export const uploadBackupToDrive = async (jsonData: string, filename: string, allowSignIn = false) => {
  let token = await getAccessToken();
  if (!token && allowSignIn) {
    const authRes = await googleSignIn();
    token = authRes?.accessToken || null;
  }
  if (!token) throw new Error('Authentication required');

  const metadata = {
    name: filename,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([jsonData], { type: 'application/json' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!response.ok) {
    throw new Error('Failed to upload to Google Drive');
  }

  return response.json();
};
