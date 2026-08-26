import React, { useState, useCallback } from 'react';
import { Upload, X, GripVertical, Star, Image as ImageIcon, AlertCircle } from 'lucide-react';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function MultiImageUploader({
  images = [],
  onChange,
  disabled = false
}) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only JPG, PNG, WEBP allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit.';
    }
    return null;
  };

  const handleFiles = useCallback((files) => {
    setError('');
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    for (const file of fileArray) {
      if (images.length + validFiles.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} images allowed`);
        break;
      }
      const err = validateFile(file);
      if (err) {
        errors.push(`${file.name}: ${err}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      onChange([...images, ...validFiles]);
    }
  }, [images, onChange]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  }, [images, onChange]);

  const setPrimary = useCallback((index) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    onChange(newImages);
  }, [images, onChange]);

  const moveImage = useCallback((index, direction) => {
    const newImages = [...images];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    onChange(newImages);
  }, [images, onChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-white flex items-center gap-1.5">
        <ImageIcon className="w-4 h-4 text-amber-400" />
        Property Images ({images.length}/{MAX_FILES})
      </label>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 whitespace-pre-line">{error}</p>
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition ${
          dragActive
            ? 'border-amber-500 bg-amber-500/5'
            : 'border-slate-700 hover:border-amber-500/60 bg-slate-900/60'
        } ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={disabled || images.length >= MAX_FILES}
        />
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              Drag & drop images here, or click to browse
            </p>
            <p className="text-xs text-slate-400 mt-1">
              JPG, PNG, WEBP (Max 10MB each, up to {MAX_FILES} images)
            </p>
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative group bg-slate-900 border border-slate-800 rounded-xl overflow-hidden aspect-square"
            >
              <img
                src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-30 transition"
                    title="Move left"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrimary(index)}
                    className={`p-1.5 rounded-lg transition ${
                      img.isPrimary
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                    title="Set as primary"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-30 transition"
                    title="Move right"
                  >
                    <GripVertical className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1.5 bg-red-500 hover:bg-red-400 text-white rounded-lg transition"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {img.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg uppercase tracking-wider">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length < 3 && (
        <p className="text-xs text-amber-400 font-medium">
          Minimum 3 images required to publish property
        </p>
      )}
    </div>
  );
}
