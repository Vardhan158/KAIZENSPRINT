import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelectDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option...',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.id) === String(value));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-left text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100 flex items-center justify-between cursor-pointer transition"
      >
        <div className="min-w-0 flex-1 pr-2">
          {selectedOption ? (
            <div>
              <div className="font-semibold text-[#0F172A] leading-snug break-words">
                {selectedOption.title} {selectedOption.badge && <span className="font-mono text-xs text-[#2563EB] font-bold">({selectedOption.badge})</span>}
              </div>
              {selectedOption.subtitle && (
                <div className="text-xs text-[#475569] leading-tight mt-0.5 break-words">
                  {selectedOption.subtitle}
                </div>
              )}
            </div>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Box */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
          {options.length === 0 ? (
            <div className="p-4 text-xs text-slate-400 text-center">No options available</div>
          ) : (
            options.map(opt => {
              const isSelected = String(opt.id) === String(value);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 text-left transition flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected ? 'bg-blue-50/80 text-[#2563EB]' : 'hover:bg-slate-50 text-[#0F172A]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm leading-snug break-words">
                      {opt.title} {opt.badge && <span className="font-mono text-xs text-[#2563EB] font-bold">({opt.badge})</span>}
                    </div>
                    {opt.subtitle && (
                      <div className="text-xs text-[#475569] leading-tight mt-0.5 break-words">
                        {opt.subtitle}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#2563EB] shrink-0 mt-1" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
