const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CLOUDINARY_UPLOAD_URL = CLOUDINARY_CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
  : null;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const validateImage = (file) => {
  if (!file) {
    throw new Error("Selecciona una imagen.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WEBP.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("La imagen no puede superar los 5 MB.");
  }
};

export const uploadDoctorImage = async (file, medicoId) => {
  validateImage(file);

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Configura VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  if (
    medicoId === null ||
    medicoId === undefined ||
    String(medicoId).trim() === ""
  ) {
    throw new Error("Se necesita el ID del médico.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `medicos/${medicoId}`);

  let response;

  try {
    response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("No se pudo conectar con Cloudinary.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "No se pudo subir la imagen a Cloudinary."
    );
  }

  if (!data.secure_url || !data.public_id) {
    throw new Error("Cloudinary no devolvió los datos esperados de la imagen.");
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

export const uploadDoctorImageForDatabase = async (file, medicoId) => {
  const image = await uploadDoctorImage(file, medicoId);

  return {
    foto_url: image.url,
    foto_public_id: image.publicId,
    foto_version: image.version,
  };
};


export function getDoctorProfileImage(publicId) {
  if (!publicId) {
    return '';
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.error(
      'Falta configurar VITE_CLOUDINARY_CLOUD_NAME'
    );
    return '';
  }

  const encodedPublicId = publicId
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${encodedPublicId}`;
}
