import React from 'react';

interface PromptPresetChipsProps {
  onSelect: (suffix: string) => void;
}

const STYLE_PRESETS = [
  { label: '✨ Điện ảnh 8K', promptSuffix: ', cinematic lighting, ultra-detailed 8k, photorealistic' },
  { label: '🌆 Cyberpunk', promptSuffix: ', cyberpunk aesthetic, neon glow, futuristic city vibes' },
  { label: '🎨 Anime Art', promptSuffix: ', anime style, Makoto Shinkai aesthetic, vibrant colors' },
  { label: '🧸 3D Pixar', promptSuffix: ', 3D animation style, cute character design, soft volumetric lighting' },
  { label: '📸 Chân dung thật', promptSuffix: ', candid portrait photography, 85mm f/1.4 lens, natural skin texture' },
];

export const PromptPresetChips: React.FC<PromptPresetChipsProps> = ({ onSelect }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar-light">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
        Gợi ý style:
      </span>
      {STYLE_PRESETS.map((style) => (
        <button
          key={style.label}
          type="button"
          onClick={() => onSelect(style.promptSuffix)}
          className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-slate-100/80 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 border border-slate-200/80 text-slate-600 transition-all duration-150 active:scale-95 font-medium shadow-2xs"
        >
          {style.label}
        </button>
      ))}
    </div>
  );
};
