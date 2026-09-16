/**
 * Modal Unificado de Confirmação e Notificação (Design System CadernoFiado)
 * Substitui alert() e confirm() nativos por diálogos consistentes e modernos.
 */

window.ConfirmModal = function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'success' | 'info'
  onConfirm,
  onCancel,
  showCancel = true
}) {
  if (!isOpen) return null;

  const { AlertTriangle, Trash2, CheckCircle2, Info, X } = window.Icons || {};

  const icons = {
    danger: Trash2 ? <Trash2 size={24} /> : <span>🗑️</span>,
    warning: AlertTriangle ? <AlertTriangle size={24} /> : <span>⚠️</span>,
    success: CheckCircle2 ? <CheckCircle2 size={24} /> : <span>✅</span>,
    info: Info ? <Info size={24} /> : <span>ℹ️</span>
  };

  const badgeClasses = {
    danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    info: 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
  };

  const confirmBtnClasses = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    warning: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    info: 'bg-slate-700 hover:bg-slate-600 text-white'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-5 space-y-4 animate-pop-in">
        
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${badgeClasses[variant] || badgeClasses.info}`}>
            {icons[variant] || icons.info}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
              {title || 'Confirmação'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-medium text-xs transition-colors btn-smooth"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-transform active:scale-95 btn-smooth ${confirmBtnClasses[variant] || confirmBtnClasses.danger}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};
