const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CLOUDINARY_UPLOAD_URL = CLOUDINARY_CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
  : null;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const validateImage = (file) => {
  if (!file) {
    throw new Error('Selecciona una imagen.');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Formato no permitido. Usa JPG, PNG o WEBP.');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('La imagen no puede superar los 5 MB.');
  }
};

const subirImagenCloudinary = async (file, usuarioId) => {
  validateImage(file);

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET.',
    );
  }

  if (
    usuarioId === null ||
    usuarioId === undefined ||
    String(usuarioId).trim() === ''
  ) {
    throw new Error('Se necesita el ID del usuario.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `usuarios/${usuarioId}`);

  let response;

  try {
    response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('No se pudo conectar con Cloudinary.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.message || 'No se pudo subir la imagen a Cloudinary.',
    );
  }

  if (!data.secure_url || !data.public_id) {
    throw new Error(
      'Cloudinary no devolvió los datos esperados de la imagen.',
    );
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    version: data.version,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
};

/**
 * Sube la imagen a Cloudinary.
 * No modifica la base de datos.
 */
export const uploadUserImage = async (file, usuarioId) => {
  return subirImagenCloudinary(file, usuarioId);
};

/**
 * Devuelve los campos que deben guardarse en public.usuarios.
 * El llamador debe enviarlos al backend o a Supabase.
 */
export const uploadUserImageForDatabase = async (file, usuarioId) => {
  const image = await subirImagenCloudinary(file, usuarioId);

  return {
    foto_url: image.url,
    foto_public_id: image.publicId,
    foto_version: image.version,
  };
};

/**
 * Genera la URL de visualización a partir del public_id.
 */
export function getUserProfileImage(publicId) {
  if (!publicId) return '';

  if (!CLOUDINARY_CLOUD_NAME) {
    console.error('Falta configurar VITE_CLOUDINARY_CLOUD_NAME');
    return '';
  }

  const encodedPublicId = publicId
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${encodedPublicId}`;
}

/**
 * Compatibilidad con el servicio existente de médicos.
 * Mantiene la subida en la carpeta medicos/{medicoId}.
 */
export const uploadDoctorImage = async (file, medicoId) => {
  const image = await subirImagenCloudinary(file, medicoId);

  return image;
};

export const uploadDoctorImageForDatabase = async (file, medicoId) => {
  const image = await subirImagenCloudinary(file, medicoId);

  return {
    foto_url: image.url,
    foto_public_id: image.publicId,
    foto_version: image.version,
  };
};

export function getDoctorProfileImage(publicId) {
  return getUserProfileImage(publicId);
}
