import React, { useState } from 'react';
import axios from 'axios';
import { Settings, Check, X, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AdminFeeEditor({ configKey, currentFee, onUpdate }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [feeValue, setFeeValue] = useState(currentFee || '');
  const [saving, setSaving] = useState(false);

  if (!user || user.role !== 'Admin') return null;

  const handleUpdate = async (newValue) => {
    try {
      setSaving(true);
      await axios.put('/api/admin/settings', {
        [configKey]: newValue
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setIsEditing(false);
      setFeeValue(newValue);
      if (onUpdate) onUpdate(newValue);
    } catch (e) {
      console.error(e);
      alert('Failed to update fee');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => handleUpdate(feeValue);
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this fee? It will be set to 0.")) {
      handleUpdate("0");
    }
  };
  const handleAdd = () => {
    const val = prompt("Enter new fee amount:", currentFee);
    if (val !== null && !isNaN(val)) {
      handleUpdate(val);
    }
  };

  if (!isEditing) {
    return (
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm p-1.5 rounded-xl border border-amber-500/30 shadow-lg">
        <button 
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-1.5 hover:bg-slate-800 text-amber-400 rounded-lg transition"
          title="Edit Fee"
        >
          <Edit size={14} />
        </button>
        <button 
          type="button"
          onClick={handleAdd}
          className="p-1.5 hover:bg-slate-800 text-emerald-400 rounded-lg transition"
          title="Add Fee"
        >
          <Plus size={14} />
        </button>
        <button 
          type="button"
          onClick={handleDelete}
          className="p-1.5 hover:bg-slate-800 text-red-400 rounded-lg transition"
          title="Delete Fee"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-20 bg-slate-900 p-2 rounded-xl border border-amber-500/30 shadow-xl flex items-center gap-2">
      <input 
        type="number" 
        value={feeValue} 
        onChange={e => setFeeValue(e.target.value)}
        className="w-20 px-2 py-1 text-xs rounded border border-slate-700 bg-slate-800 text-white outline-none focus:border-amber-500"
        placeholder="Fee..."
      />
      <button 
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
      >
        <Check size={14} />
      </button>
      <button 
        type="button"
        onClick={() => setIsEditing(false)}
        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
      >
        <X size={14} />
      </button>
    </div>
  );
}
