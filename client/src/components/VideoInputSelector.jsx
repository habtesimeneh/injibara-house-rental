import React, { useState } from 'react';
import { Video, Upload, Link as LinkIcon, X, Check, Film, Play } from 'lucide-react';

const SAMPLE_VIDEOS = [
  { label: 'YouTube Short Example', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { label: 'Sample MP4 Tour', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' }
];

export default function VideoInputSelector({
  videoFile,
  setVideoFile,
  videoUrl,
  setVideoUrl,
  label = "🎬 የቤት ቪዲዮ / 360° ጉብኝት ያስገቡ (Property Video Tour)",
  subLabel = "ከስልክዎ የቪዲዮ ፋይል አፕሎድ ያድርጉ ወይም የቪዲዮ ሊንክ (YouTube/TikTok) ያስገቡ"
}) {
  const [activeTab, setActiveTab] = useState(videoFile ? 'upload' : (videoUrl ? 'link' : 'upload'));
  const [filePreview, setFilePreview] = useState(videoFile ? URL.createObjectURL(videoFile) : null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(''); // Clear URL if file selected
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setVideoUrl(url);
    setVideoFile(null); // Clear file if URL provided
    setFilePreview(null);
  };

  const handleClear = () => {
    setVideoFile(null);
    setVideoUrl('');
    setFilePreview(null);
  };

  const currentPreview = filePreview || videoUrl;

  return (
    <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Video className="w-4 h-4 text-amber-400" />
            <span>{label}</span>
          </label>
          {subLabel && <p className="text-[11px] text-slate-400 mt-0.5">{subLabel}</p>}
        </div>

        {/* Option Mode Tabs */}
        <div className="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>ቪዲዮ አፕሎድ (Upload)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>የቪዲዮ ሊንክ (Video Link)</span>
          </button>
        </div>
      </div>

      {/* Upload Video Box */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/60 transition rounded-xl p-4 text-center group cursor-pointer">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  የቤት ቪዲዮ እዚህ ይጫኑ (Click or Drag Video File)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  MP4, WEBM, MOV (Max 50MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video URL Input */}
      {activeTab === 'link' && (
        <div className="space-y-2">
          <input
            type="url"
            value={videoUrl}
            onChange={handleUrlChange}
            placeholder="https://youtube.com/shorts/... ወይም TikTok የቪዲዮ አድራሻ ሊንክ ያስገቡ"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      )}

      {/* Video Preview */}
      {currentPreview && (
        <div className="relative mt-3 rounded-xl overflow-hidden border border-amber-500/30 bg-slate-950 p-2.5 flex items-center gap-3">
          <div className="w-14 h-14 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 border border-amber-500/30 shrink-0">
            <Play className="w-6 h-6 fill-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              ቪዲዮ በተካከለ ተመርጧል (Video Tour Attached)
            </span>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {videoFile ? videoFile.name : (videoUrl || 'Video Link')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800 transition cursor-pointer"
            title="Remove video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
