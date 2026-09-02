import React from 'react';

export const saveMediaToCache = (docKey, dataUrl) => {
  if (!docKey || !dataUrl) return;
  try {
    const raw = localStorage.getItem("controlroom_media_cache") || "{}";
    const cache = JSON.parse(raw);
    cache[docKey] = dataUrl;
    localStorage.setItem("controlroom_media_cache", JSON.stringify(cache));
  } catch (e) { }
};

export const getMediaFromCache = (docKey) => {
  if (!docKey) return null;
  try {
    const raw = localStorage.getItem("controlroom_media_cache") || "{}";
    const cache = JSON.parse(raw);
    return cache[docKey] || null;
  } catch (e) {
    return null;
  }
};

export const stripDataUrlsFromRecord = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const clone = JSON.parse(JSON.stringify(obj));
  const removeDataUrl = (target) => {
    if (!target || typeof target !== "object") return;
    if (target.dataUrl) delete target.dataUrl;
    if (target.fileData) delete target.fileData;
    if (target.proofDocData) delete target.proofDocData;
    Object.keys(target).forEach(k => {
      if (target[k] && typeof target[k] === "object") removeDataUrl(target[k]);
    });
  };
  removeDataUrl(clone);
  return clone;
};

export const readCompressedImage = (file, callback) => {
  if (!file) {
    if (callback) callback(null);
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target ? e.target.result : null;
    if (callback) callback(result);
  };
  reader.onerror = () => {
    if (callback) callback(null);
  };
  try {
    reader.readAsDataURL(file);
  } catch (err) {
    if (callback) callback(null);
  }
};

export const compressAndSaveFile = (file, callback) => {
  if (!file) return callback(null);
  const isImg = (file.type && file.type.startsWith("image/")) || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name || "");
  const baseMeta = {
    name: file.name,
    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    type: file.type || (isImg ? "image/png" : "application/pdf"),
    uploadedAt: new Date().toISOString()
  };

  const reader = new FileReader();
  reader.onload = (e) => {
    const rawDataUrl = e.target ? e.target.result : null;
    if (!rawDataUrl) {
      return callback(baseMeta);
    }
    if (isImg) {
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width || 600;
          let height = img.height || 400;
          const maxDim = 600;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const compressedData = canvas.toDataURL("image/jpeg", 0.6);
          baseMeta.dataUrl = compressedData;
          if (baseMeta.name) {
            saveMediaToCache(baseMeta.name, compressedData);
          }
          callback(baseMeta);
        } catch (err) {
          baseMeta.dataUrl = rawDataUrl;
          if (baseMeta.name) saveMediaToCache(baseMeta.name, rawDataUrl);
          callback(baseMeta);
        }
      };
      img.onerror = () => {
        baseMeta.dataUrl = rawDataUrl;
        if (baseMeta.name) saveMediaToCache(baseMeta.name, rawDataUrl);
        callback(baseMeta);
      };
      img.src = rawDataUrl;
    } else {
      baseMeta.dataUrl = rawDataUrl;
      if (baseMeta.name) saveMediaToCache(baseMeta.name, rawDataUrl);
      callback(baseMeta);
    }
  };
  reader.onerror = () => callback(baseMeta);
  reader.readAsDataURL(file);
};
