const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CLOUDINARY_UPLOAD_URL =
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


/**
 * Valida que el archivo sea una imagen permitida.
 */
const validateImage = (file) => {
  if (!file) {
    throw new Error("No se proporcionó ninguna imagen.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Formato no permitido. Usa JPG, PNG o WEBP."
    );
  }

  // 5 MB máximo
  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error(
      "La imagen no puede superar los 5 MB."
    );
  }
};


/**
 * Sube una imagen de médico a Cloudinary.
 *
 * @param {File} file
 * @param {number|string} medicoId
 *
 * @returns {{
 *   url: string,
 *   publicId: string,
 *   version: number,
 *   width: number,
 *   height: number,
 *   format: string,
 *   bytes: number
 * }}
 */
export const uploadDoctorImage = async (file, medicoId) => {

  validateImage(file);

  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      "Falta VITE_CLOUDINARY_CLOUD_NAME en las variables de entorno."
    );
  }

  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Falta VITE_CLOUDINARY_UPLOAD_PRESET en las variables de entorno."
    );
  }

  if (!medicoId) {
    throw new Error(
      "Se necesita el ID del médico para subir la imagen."
    );
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );

  /**
   * Organizamos las imágenes por médico.
   *
   * Ejemplo:
   * medicos/15
   */
  formData.append(
    "folder",
    `medicos/${medicoId}`
  );

  const response = await fetch(
    CLOUDINARY_UPLOAD_URL,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      "Error al subir la imagen a Cloudinary."
    );
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
    version: data.version,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes
  };
};


/**
 * Sube una imagen y devuelve directamente
 * los campos que necesita la tabla medicos.
 *
 * @param {File} file
 * @param {number|string} medicoId
 */
export const uploadDoctorImageForDatabase = async (
  file,
  medicoId
) => {

  const image = await uploadDoctorImage(
    file,
    medicoId
  );

  return {
    foto_url: image.url,
    foto_public_id: image.publicId,
    foto_version: image.version
  };
};


/**
 * Genera una URL optimizada de Cloudinary.
 *
 * No vuelve a subir la imagen.
 *
 * Ejemplo:
 *
 * getDoctorImageUrl(
 *   "medicos/15/foto",
 *   {
 *     width: 300,
 *     height: 300
 *   }
 * )
 */
export const getDoctorImageUrl = (
  publicId,
  {
    width = 400,
    height = 400,
    crop = "fill",
    gravity = "face",
    quality = "auto",
    format = "auto"
  } = {}
) => {

  if (!publicId) {
    return null;
  }

  const transformations = [
    `c_${crop}`,
    `w_${width}`,
    `h_${height}`,
    `g_${gravity}`,
    `q_${quality}`,
    `f_${format}`
  ].join(",");

  return (
    `https://res.cloudinary.com/` +
    `${CLOUDINARY_CLOUD_NAME}/image/upload/` +
    `${transformations}/` +
    `${publicId}`
  );
};


/**
 * Obtiene una imagen pequeña para listados
 * de médicos.
 */
export const getDoctorThumbnail = (publicId) => {
  return getDoctorImageUrl(publicId, {
    width: 150,
    height: 150,
    crop: "fill",
    gravity: "face"
  });
};


/**
 * Obtiene una imagen grande para el perfil
 * del médico.
 */
export const getDoctorProfileImage = (publicId) => {
  return getDoctorImageUrl(publicId, {
    width: 600,
    height: 600,
    crop: "fill",
    gravity: "face"
  });
};

