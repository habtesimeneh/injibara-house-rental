import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2, Trash2, Globe, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchAllSEOMeta } from '../utils/seoService';
import ListSkeleton from './ListSkeleton';

export default function SeoManager() {
  const [metaList, setMetaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    route_path: '',
    title: '',
    description: '',
    keywords: '',
    og_image: '',
  });

  useEffect(() => {
    loadSEOMeta();
  }, []);

  const loadSEOMeta = async () => {
    setLoading(true);
    try {
      const data = await fetchAllSEOMeta(true);
      setMetaList(data || []);
    } catch (err) {
      console.error(err);
      showNotification('Failed to load SEO meta list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      route_path: item.route_path,
      title: item.title,
      description: item.description || '',
      keywords: item.keywords || '',
      og_image: item.og_image || '',
    });
  };

  const handleCreateNew = () => {
    setEditingItem({ id: 'new' });
    setFormData({
      route_path: '/',
      title: '',
      description: '',
      keywords: '',
      og_image: '',
    });
  };

  const handleDelete = async (id, path) => {
    if (!window.confirm(`Are you sure you want to delete SEO meta for ${path}?`)) return;
    try {
      await axios.delete(`/api/admin/seo/${id}`);
      showNotification(`SEO meta for ${path} deleted.`);
      loadSEOMeta();
    } catch (err) {
      showNotification('Failed to delete SEO meta item', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/admin/seo', formData);
      showNotification(`SEO Meta for ${formData.route_path} updated successfully!`);
      setEditingItem(null);
      loadSEOMeta();
    } catch (err) {
      showNotification('Failed to save SEO meta tags.', 'error');
    }
  };

  const filteredList = metaList.filter(
    (item) =>
      item.route_path.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.keywords && item.keywords.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-2">
            <Globe className="text-amber-500" size={32} />
            SEO Meta Tags Manager
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage page titles, meta descriptions, and keywords dynamically for Google Search indexing.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black tracking-wide uppercase px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer text-sm"
        >
          <Plus size={18} />
          Add Route SEO
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
            notification.type === 'error'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {notification.msg}
        </div>
      )}

      {/* Editor Modal / Inline Form */}
      {editingItem && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-4 animate-fadeIn relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Globe size={150} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-6">
              <h3 className="font-bold text-amber-500 text-xl flex items-center gap-2">
                <Edit2 size={20} />
                {editingItem.id === 'new' ? 'Create Route SEO Entry' : `Edit SEO Meta for "${editingItem.route_path}"`}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-500 hover:text-slate-300 text-sm font-bold uppercase"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Route Path (URL)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="/houses or /houses/1"
                    value={formData.route_path}
                    onChange={(e) => setFormData({ ...formData, route_path: e.target.value })}
                    className="w-full text-sm px-4 py-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                    disabled={editingItem.id !== 'new'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Page Title (60 chars max recommended)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="እንጅባራ ቤት ደላላ | Injibara House Broker"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-sm px-4 py-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Meta Description (150 - 160 chars recommended)
                </label>
                <textarea
                  rows={2}
                  placeholder="በእንጅባራ ከተማ የሚከራዩ ዘመናዊ ቤቶች..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-sm px-4 py-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Meta Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="እንጅባራ ቤት ደላላ, Injibara house rent, Injibara university rentals"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full text-sm px-4 py-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Open Graph Image URL (OG Image)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.og_image}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    className="w-full text-sm px-4 py-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wide px-8 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition"
                >
                  <Save size={18} />
                  Save SEO Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-500" size={20} />
        <input
          type="text"
          placeholder="Filter routes or title keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
      </div>

      {/* Route List Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-6">
            <ListSkeleton rows={5} className="bg-transparent border-none shadow-none p-0" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm font-bold uppercase tracking-widest">No SEO meta records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-xs font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">SEO Title</th>
                  <th className="px-6 py-4">Meta Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg font-mono text-xs">
                        {item.route_path}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-300 max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-sm truncate">
                      {item.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 bg-blue-400/10 p-2 rounded-xl transition cursor-pointer"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.route_path)}
                        className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-400/10 p-2 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
