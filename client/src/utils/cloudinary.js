const CLOUDINARY_SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js';

export const loadCloudinaryScript = () =>
  new Promise((resolve, reject) => {
    if (window.cloudinary) {
      resolve(window.cloudinary);
      return;
    }

    const existing = document.querySelector(`script[src="${CLOUDINARY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.cloudinary));
      existing.addEventListener('error', () =>
        reject(new Error('Cloudinary 위젯을 불러오지 못했습니다.'))
      );
      return;
    }

    const script = document.createElement('script');
    script.src = CLOUDINARY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.cloudinary);
    script.onerror = () => reject(new Error('Cloudinary 위젯을 불러오지 못했습니다.'));
    document.body.appendChild(script);
  });

export const openCloudinaryUploadWidget = async ({ onSuccess, onError } = {}) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary 환경 변수(VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET)를 설정해주세요.'
    );
  }

  const cloudinary = await loadCloudinaryScript();

  const widget = cloudinary.createUploadWidget(
    {
      cloudName,
      uploadPreset,
      sources: ['local', 'url', 'camera'],
      multiple: false,
      folder: 'shopping-demo/products',
      resourceType: 'image',
      clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      maxFileSize: 2 * 1024 * 1024,
      cropping: false,
    },
    (error, result) => {
      if (error) {
        onError?.(error);
        return;
      }

      if (result?.event === 'success') {
        onSuccess?.(result.info);
      }
    }
  );

  widget.open();
};
