/**
 * Modal de Assinatura Digital (Formalizar Acordo Anticalote)
 * Recurso VIP. Captura assinatura do cliente via Canvas HTML5.
 */

window.SignatureModal = function SignatureModal({ isOpen, onClose, onConfirmSignature }) {
  const canvasRef = React.useRef(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(false);
  
  const { X, PenTool, Trash2, CheckCircle2 } = window.Icons || {};

  React.useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      // Ajusta para densidade de pixels do celular
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0f172a'; // slate-900
      
      // Fundo transparente (ou branco)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      setHasSignature(false);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    const scale = window.devicePixelRatio || 1;
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (!hasSignature) return;
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');
    onConfirmSignature(signatureData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 animate-fadeIn" style={{ touchAction: 'none' }}>
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-pop-in transition-colors">
        
        {/* Cabeçalho Premium */}
        <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div className="flex items-center space-x-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shadow-inner">
              <PenTool size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                Assinatura do Cliente
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">Formalizar Acordo de Confissão</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-colors relative z-10">
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 flex-1 flex flex-col">
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed text-center mb-3">
            Peça para o cliente assinar no quadro abaixo com o dedo.
          </p>

          <div className="flex-1 relative bg-white border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-48 touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasSignature && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="text-slate-300 font-medium text-lg rotate-[-10deg]">Assine aqui</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={clearCanvas}
              className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center btn-smooth flex-1"
            >
              <Trash2 size={16} className="mr-1.5" /> Limpar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasSignature}
              className={`py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center flex-[2] btn-smooth ${
                hasSignature 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={18} className="mr-1.5" />
              <span>Confirmar & Gerar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
