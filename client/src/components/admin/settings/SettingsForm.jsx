export default function SettingsForm({ label, error, children, required }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider ml-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-400 ml-1">{error}</p>}
    </div>
  );
}
