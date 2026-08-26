import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, Sparkles } from 'lucide-react';

const DEFAULT_SAMPLE_IMAGES = [
  { label: 'መኖሪያ ቤት (Modern House)', url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80' },
  { label: 'ቪላ / ቪላ አፓርታማ (Villa)', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80' },
  { label: 'አፓርታማ / ኮንዶሚኒየም (Apartment)', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80' },
  { label: 'የንግድ ሱቅ (Commercial Shop)', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80' }
];

export default function ImageInputSelector({
  imageFile,
  setImageFile,
  imageUrl,
  setImageUrl,
  label = "የቤት/ቦታ ምስል ያስገቡ (Property Photo)",
  subLabel = "ከስልክዎ አፕሎድ ያድርጉ ወይም የፎቶ ሊንክ ያስገቡ (Upload file or paste image link)"
}) {
  const [activeTab, setActiveTab] = useState(imageFile ? 'upload' : (imageUrl ? 'link' : 'upload'));
  const [filePreview, setFilePreview] = useState(imageFile ? URL.createObjectURL(imageFile) : null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl(''); // Clear URL if file selected
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setImageFile(null); // Clear file if URL provided
    setFilePreview(null);
  };

  const handleSelectSample = (url) => {
    setImageUrl(url);
    setImageFile(null);
    setFilePreview(null);
    setActiveTab('link');
  };

  const handleClear = () => {
    setImageFile(null);
    setImageUrl('');
    setFilePreview(null);
  };

  const currentPreview = filePreview || imageUrl;

  return (
    <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-sm font-bold text-white flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>{label}</span>
          </label>
          {subLabel && <p className="text-xs text-slate-400 mt-0.5">{subLabel}</p>}
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
            <span>አፕሎድ (Upload File)</span>
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
            <span>የምስል ሊንክ (URL Link)</span>
          </button>
        </div>
      </div>

      {/* Upload File Box */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/60 transition rounded-xl p-4 text-center group cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  ፎቶ እዚህ ጋር ይጫኑ ወይም ይጎትቱ (Click or Drag File)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  JPG, PNG, WEBP (Max 5MB)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image URL Link Input */}
      {activeTab === 'link' && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              value={imageUrl}
              onChange={handleUrlChange}
              placeholder="https://images.unsplash.com/... ወይም የፎቶ አድራሻ ሊንክ ያስገቡ"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Preset Sample Photos for 1-click addition */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ወዲያውኑ ለመጠቀም ዝግጁ ምስሎች (Sample Photos):</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_SAMPLE_IMAGES.map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSample(sample.url)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                    imageUrl === sample.url
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {imageUrl === sample.url && <Check className="w-3 h-3 text-amber-400" />}
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Window */}
      {currentPreview && (
        <div className="relative mt-3 rounded-xl overflow-hidden border border-amber-500/30 bg-slate-950 p-2 flex items-center gap-3">
          <img
            src={currentPreview}
            alt="Preview"
            className="w-16 h-16 object-cover rounded-lg border border-slate-800 shrink-0"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80';
            }}
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              ምስል በተካከለ ተመርጧል (Photo Selected)
            </span>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {imageFile ? imageFile.name : (imageUrl || 'URL Image')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-800 transition cursor-pointer"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
