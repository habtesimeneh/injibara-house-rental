import React, { useState, useEffect } from 'react';
import { Calendar, Bell, Clock, CheckCircle2, AlertTriangle, Send, DollarSign, Building, Plus } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import ListSkeleton from './ListSkeleton';

const RentReminderWidget = ({ user }) => {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [myHouses, setMyHouses] = useState([]);
  const [newReminder, setNewReminder] = useState({
    house_id: '',
    tenant_id: '',
    monthly_rent: '',
    due_day_of_month: 1
  });

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/rent-reminders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReminders(res.data || []);
    } catch (err) {
      console.error('Error loading reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();

    if (user && (user.role === 'Landlord' || user.role === 'Admin')) {
      axios.get('/api/houses/my-houses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(res => setMyHouses(res.data || [])).catch(() => {});
    }
  }, [user]);

  const handleNotifyTenant = async (reminderId) => {
    try {
      setMessage({ type: '', text: '' });
      await axios.post(`/api/rent-reminders/${reminderId}/notify`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage({ type: 'success', text: 'የኪራይ ክፍያ ማስታወሻ መልእክት ለተከራዩ በስኬት ተልኳል!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'ማስታወሻ መላክ አልተሳካም።' });
    }
  };

  const handleMarkPaid = async (reminderId) => {
    try {
      setMessage({ type: '', text: '' });
      await axios.put(`/api/rent-reminders/${reminderId}/mark-paid`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage({ type: 'success', text: 'የወርሃዊ ኪራይ ክፍያ እንደተከፈለ በስኬት ተመዝግቧል!' });
      fetchReminders();
    } catch (err) {
      setMessage({ type: 'error', text: 'ክፍያ መመዝገብ አልተሳካም።' });
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/rent-reminders', newReminder, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setShowAddModal(false);
      setMessage({ type: 'success', text: 'አዲስ የኪራይ ክፍያ ማስታወሻ በስኬት ተመዝግቧል!' });
      fetchReminders();
    } catch (err) {
      setMessage({ type: 'error', text: 'ማስታወሻ መመዝገብ አልተሳካም።' });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">የወርሃዊ ኪራይ ክፍያ ማስታወሻ (Rent Due Date Reminder)</h3>
            <p className="text-xs text-slate-400">የኪራይ ክፍያ ቀናትን ይከታተሉ እና የማስታወሻ መልእክት ይላኩ</p>
          </div>
        </div>

        {user && (user.role === 'Landlord' || user.role === 'Admin') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> አዲስ የኪራይ ቀነ ቀጠሮ መዝግብ
          </button>
        )}
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
          message.type === 'error' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          {message.text}
        </div>
      )}

      {/* Reminders List */}
      {loading ? (
        <ListSkeleton rows={3} />
      ) : reminders.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm font-medium">ምንም የተመዘገበ የወርሃዊ ኪራይ ክፍያ ቀነ ቀጠሮ የለም።</p>
          <p className="text-xs text-slate-500 mt-1">የኪራይ ውል ስምምነት ሲያዘጋጁ ወይም አዲስ ቀነ ቀጠሮ ሲመዘግቡ እዚህ ይታያል!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((rem) => {
            const isOverdue = rem.calculated_status === 'Overdue';
            const isDueSoon = rem.calculated_status === 'Due Soon';
            const isPaid = rem.calculated_status === 'Paid';

            return (
              <div 
                key={rem.reminder_id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isPaid 
                    ? 'bg-emerald-950/20 border-emerald-500/30' 
                    : isOverdue 
                    ? 'bg-rose-950/20 border-rose-500/40' 
                    : isDueSoon 
                    ? 'bg-amber-950/20 border-amber-500/40' 
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-amber-400" />
                      {rem.house_title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{rem.house_city} {rem.house_address ? `• ${rem.house_address}` : ''}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isPaid 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : isOverdue 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : isDueSoon 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isPaid ? 'ተከፍሏል (Paid)' : isOverdue ? 'ቀኑ ያለፈበት!' : isDueSoon ? 'ቀኑ ደርሷል!' : 'በተለመደው ጊዜ'}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-400">ወርሃዊ ኪራይ</p>
                    <p className="font-bold text-amber-400 text-sm">{Number(rem.monthly_rent).toLocaleString()} ETB</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">ቀጣይ የሚከፈልበት ቀን</p>
                    <p className="font-bold text-white">{rem.next_due_date} ({rem.due_day_of_month}ኛ ቀን)</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-slate-400">
                    {user?.role === 'Landlord' ? `ተከራይ: ${rem.tenant_name}` : `አከራይ: ${rem.landlord_name}`}
                  </div>

                  <div className="flex items-center gap-2">
                    {user?.role === 'Landlord' && !isPaid && (
                      <button
                        onClick={() => handleNotifyTenant(rem.reminder_id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5" /> ማስታወሻ ላክ
                      </button>
                    )}

                    {!isPaid && (
                      <button
                        onClick={() => handleMarkPaid(rem.reminder_id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> ተከፍሏል መዝግብ
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal to add manual rent schedule */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-20 sm:pt-28 pb-12 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl my-4">
            <h3 className="text-lg font-black text-amber-400 mb-4">አዲስ የወርሃዊ ኪራይ ቀነ ቀጠሮ መዝግብ</h3>
            
            <form onSubmit={handleCreateReminder} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">የሚከራየው ቤት *</label>
                <select
                  required
                  value={newReminder.house_id}
                  onChange={(e) => {
                    const h = myHouses.find(item => item.house_id === Number(e.target.value));
                    setNewReminder({ 
                      ...newReminder, 
                      house_id: e.target.value,
                      monthly_rent: h ? h.price : newReminder.monthly_rent
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="">ቤት ይምረጡ...</option>
                  {myHouses.map(h => (
                    <option key={h.house_id} value={h.house_id}>{h.title} ({h.city}) - {h.price} ETB</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">የተከራይ User ID *</label>
                <input
                  type="text"
                  required
                  placeholder="ለምሳሌ፡ 4"
                  value={newReminder.tenant_id}
                  onChange={(e) => setNewReminder({ ...newReminder, tenant_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">ወርሃዊ ኪራይ (ETB) *</label>
                <input
                  type="number"
                  required
                  value={newReminder.monthly_rent}
                  onChange={(e) => setNewReminder({ ...newReminder, monthly_rent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">በየወሩ የሚከፈልበት ቀን (1 - 28) *</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  required
                  value={newReminder.due_day_of_month}
                  onChange={(e) => setNewReminder({ ...newReminder, due_day_of_month: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  ሰርዝ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-600"
                >
                  መዝግብ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RentReminderWidget;
