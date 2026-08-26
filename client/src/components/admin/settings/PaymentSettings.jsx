import { useState, useEffect } from 'react';
import SettingsCard from './SettingsCard';
import SettingsForm from './SettingsForm';
import SettingsModal from './SettingsModal';
import SettingsTable from './SettingsTable';
import { adminApi } from '../../../services/adminApi';

export default function PaymentSettings() {
  const [config, setConfig] = useState({
    telebirr_no: '', telebirr_name: '', cbe_account: '', cbe_account_name: '',
    abyssinia_account: '', abyssinia_account_name: '', mpesa_account: '', mpesa_account_name: '',
    amhara_account: '', amhara_account_name: '', ad_fee_featured_house: '', ad_fee_tenant_seeking: '',
    ad_fee_tenant_contact: '', ad_fee_banner: ''
  });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({ bank_name: '', account_name: '', account_number: '', payment_type: 'Bank Transfer', instructions: '', qr_code_url: '', is_active: true });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configData, accountsData] = await Promise.all([
        adminApi.getPaymentConfig(),
        adminApi.getPaymentAccounts()
      ]);
      setConfig((prev) => ({ ...prev, ...configData }));
      setAccounts(accountsData.paymentAccounts || []);
    } catch (err) {
      console.error('Failed to load payment settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSettings(config);
      alert('Payment configuration saved');
    } catch (err) {
      alert(err.message || 'Failed to save payment config');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await adminApi.updatePaymentAccount(editingAccount.id, accountForm);
        alert('Payment account updated');
      } else {
        await adminApi.createPaymentAccount(accountForm);
        alert('Payment account created');
      }
      setAccountModalOpen(false);
      setEditingAccount(null);
      setAccountForm({ bank_name: '', account_name: '', account_number: '', payment_type: 'Bank Transfer', instructions: '', qr_code_url: '', is_active: true });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to save payment account');
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setAccountForm({
      bank_name: account.bank_name || '',
      account_name: account.account_name || '',
      account_number: account.account_number || '',
      payment_type: account.payment_type || 'Bank Transfer',
      instructions: account.instructions || '',
      qr_code_url: account.qr_code_url || '',
      is_active: account.is_active
    });
    setAccountModalOpen(true);
  };

  const handleDeleteAccount = async (account) => {
    if (!confirm(`Delete payment account "${account.bank_name}"?`)) return;
    try {
      await adminApi.deletePaymentAccount(account.id);
      alert('Payment account deleted');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete payment account');
    }
  };

  const accountColumns = [
    { key: 'bank_name', label: 'Bank / Provider' },
    { key: 'account_name', label: 'Account Name' },
    { key: 'account_number', label: 'Account Number' },
    { key: 'payment_type', label: 'Type' },
    { key: 'is_active', label: 'Active', render: (val) => val ? 'Yes' : 'No' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-slate-800/50 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Payment Configuration"
        subtitle="Fees and public payment account details"
        actions={
          <button onClick={() => { setEditingAccount(null); setAccountForm({ bank_name: '', account_name: '', account_number: '', payment_type: 'Bank Transfer', instructions: '', qr_code_url: '', is_active: true }); setAccountModalOpen(true); }} className="px-6 py-2.5 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition">
            Add Account
          </button>
        }
      >
        <form onSubmit={handleConfigSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsForm label="Telebirr Number">
            <input value={config.telebirr_no} onChange={(e) => setConfig({ ...config, telebirr_no: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Telebirr Name">
            <input value={config.telebirr_name} onChange={(e) => setConfig({ ...config, telebirr_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="CBE Account">
            <input value={config.cbe_account} onChange={(e) => setConfig({ ...config, cbe_account: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="CBE Account Name">
            <input value={config.cbe_account_name} onChange={(e) => setConfig({ ...config, cbe_account_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Abyssinia Account">
            <input value={config.abyssinia_account} onChange={(e) => setConfig({ ...config, abyssinia_account: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Abyssinia Account Name">
            <input value={config.abyssinia_account_name} onChange={(e) => setConfig({ ...config, abyssinia_account_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="M-Pesa Account">
            <input value={config.mpesa_account} onChange={(e) => setConfig({ ...config, mpesa_account: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="M-Pesa Account Name">
            <input value={config.mpesa_account_name} onChange={(e) => setConfig({ ...config, mpesa_account_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Amhara Bank Account">
            <input value={config.amhara_account} onChange={(e) => setConfig({ ...config, amhara_account: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Amhara Bank Account Name">
            <input value={config.amhara_account_name} onChange={(e) => setConfig({ ...config, amhara_account_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Featured House Fee (ETB)">
            <input type="number" value={config.ad_fee_featured_house} onChange={(e) => setConfig({ ...config, ad_fee_featured_house: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Tenant Seeking Fee (ETB)">
            <input type="number" value={config.ad_fee_tenant_seeking} onChange={(e) => setConfig({ ...config, ad_fee_tenant_seeking: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Tenant Contact Fee (ETB)">
            <input type="number" value={config.ad_fee_tenant_contact} onChange={(e) => setConfig({ ...config, ad_fee_tenant_contact: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <SettingsForm label="Banner Ad Fee (ETB)">
            <input type="number" value={config.ad_fee_banner} onChange={(e) => setConfig({ ...config, ad_fee_banner: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
          </SettingsForm>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard title="Payment Accounts" subtitle="Manage bank accounts and payment methods">
        <SettingsTable
          columns={accountColumns}
          data={accounts}
          loading={loading}
          emptyMessage="No payment accounts configured"
          onEdit={handleEditAccount}
          onDelete={handleDeleteAccount}
        />
      </SettingsCard>

      <SettingsModal
        isOpen={accountModalOpen}
        onClose={() => { setAccountModalOpen(false); setEditingAccount(null); }}
        title={editingAccount ? 'Edit Payment Account' : 'Add Payment Account'}
        onSubmit={handleAccountSubmit}
        submitLabel={editingAccount ? 'Update' : 'Create'}
      >
        <SettingsForm label="Bank / Provider Name" required>
          <input value={accountForm.bank_name} onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
        </SettingsForm>
        <SettingsForm label="Account Name" required>
          <input value={accountForm.account_name} onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
        </SettingsForm>
        <SettingsForm label="Account Number" required>
          <input value={accountForm.account_number} onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
        </SettingsForm>
        <SettingsForm label="Payment Type">
          <select value={accountForm.payment_type} onChange={(e) => setAccountForm({ ...accountForm, payment_type: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none">
            <option>Bank Transfer</option>
            <option>Telebirr</option>
            <option>Cash</option>
            <option>Other</option>
          </select>
        </SettingsForm>
        <SettingsForm label="Instructions">
          <textarea rows={2} value={accountForm.instructions} onChange={(e) => setAccountForm({ ...accountForm, instructions: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
        </SettingsForm>
        <SettingsForm label="QR Code URL">
          <input value={accountForm.qr_code_url} onChange={(e) => setAccountForm({ ...accountForm, qr_code_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-amber-500 focus:outline-none" />
        </SettingsForm>
        <SettingsForm label="Active">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={accountForm.is_active} onChange={(e) => setAccountForm({ ...accountForm, is_active: e.target.checked })} className="w-5 h-5 rounded accent-amber-500" />
            <span className="text-sm text-slate-300">Enabled</span>
          </label>
        </SettingsForm>
      </SettingsModal>
    </div>
  );
}
