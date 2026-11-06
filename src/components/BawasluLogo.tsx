import React from 'react';

interface LogoProps {
  className?: string;
  customUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BawasluLogo: React.FC<LogoProps> = ({ className = '', customUrl, size = 'md' }) => {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt="Logo Bawaslu Kota Batam"
        className={`object-contain ${size === 'sm' ? 'h-8' : size === 'lg' ? 'h-16' : 'h-11'} ${className}`}
      />
    );
  }

  const dimension = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';

  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-red-700 via-red-800 to-amber-900 shadow-md p-1.5 border border-amber-300/40 ${dimension} ${className}`}>
      {/* Official Emblem Motif SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-amber-300 drop-shadow-sm"
      >
        {/* Shield background */}
        <path
          d="M50 5 L88 20 C88 55 68 85 50 95 C32 85 12 55 12 20 Z"
          fill="#991B1B"
          stroke="#FDE047"
          strokeWidth="3.5"
        />
        {/* Inner Eagle Wing Silhouette */}
        <path
          d="M50 25 C62 30 76 38 78 52 C70 52 64 47 50 36 C36 47 30 52 22 52 C24 38 38 30 50 25 Z"
          fill="#FACC15"
        />
        {/* Balance Scales of Justice (Timbangan Hukum) */}
        <line x1="50" y1="36" x2="50" y2="78" stroke="#FEF08A" strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="46" x2="70" y2="46" stroke="#FEF08A" strokeWidth="3.5" strokeLinecap="round" />
        {/* Left pan */}
        <path d="M26 62 L34 62 L30 46 Z" fill="#FDE047" />
        <ellipse cx="30" cy="63" rx="7" ry="2.5" fill="#FDE047" />
        {/* Right pan */}
        <path d="M66 62 L74 62 L70 46 Z" fill="#FDE047" />
        <ellipse cx="70" cy="63" rx="7" ry="2.5" fill="#FDE047" />
        {/* Star at top */}
        <polygon points="50,11 52.5,17 58,17.5 53.8,21 55.2,26.5 50,23.5 44.8,26.5 46.2,21 42,17.5 47.5,17" fill="#FDE047" />
      </svg>
    </div>
  );
};
