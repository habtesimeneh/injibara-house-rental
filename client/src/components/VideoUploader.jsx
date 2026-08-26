import React, { useState, useCallback } from 'react';
import { Upload, X, Play, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export default function VideoUploader({
  video,
  onChange,
  disabled = false
}) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only MP4, WEBM, MOV allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Video size exceeds 50MB limit.';
    }
    return null;
  };

  const handleFiles = useCallback((files) => {
    setError('');
    const file = files[0];
    if (!file) return;

    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }

    onChange(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }, [onChange]);

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

  const clearVideo = useCallback(() => {
    onChange(null);
    setPreview(null);
  }, [onChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-white flex items-center gap-1.5">
        <Play className="w-4 h-4 text-amber-400" />
        Property Video (MP4, WEBM, MOV - Max 50MB)
      </label>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {!video ? (
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
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={disabled}
          />
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Drag & drop video here, or click to browse
              </p>
              <p className="text-xs text-slate-400 mt-1">
                MP4, WEBM, MOV (Max 50MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-20 h-20 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 border border-amber-500/30 shrink-0">
            <Play className="w-8 h-8 fill-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {typeof video === 'string' ? video : video.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {typeof video === 'object' && video.size
                ? `${(video.size / (1024 * 1024)).toFixed(1)} MB`
                : 'Video attached'}
            </p>
          </div>
          <button
            type="button"
            onClick={clearVideo}
            disabled={disabled}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition disabled:opacity-50"
            title="Remove video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
