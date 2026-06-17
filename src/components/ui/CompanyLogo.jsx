import { useEffect, useMemo, useState } from 'react';

const BRAND_STYLES = {
  google: { bg: 'bg-[#e8f0fe]', text: 'text-[#1a73e8]', label: 'G' },
  amazon: { bg: 'bg-[#fff1e6]', text: 'text-[#ff9900]', label: 'a' },
  stripe: { bg: 'bg-[#f3efff]', text: 'text-[#635bff]', label: 'S' },
  vercel: { bg: 'bg-slate-900', text: 'text-white', label: 'V' },
  microsoft: { bg: 'bg-[#eefbf3]', text: 'text-[#16a34a]', label: 'M' },
  default: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'C' },
};

function getBrandKey(company = '') {
  const normalized = company.trim().toLowerCase();
  return BRAND_STYLES[normalized] ? normalized : 'default';
}

function getFallbackLabel(company = '') {
  const trimmed = company.trim();
  if (!trimmed) return 'C';
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

export function CompanyLogo({
  company = '',
  src = '',
  alt,
  className = '',
  imageClassName = '',
  labelClassName = '',
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const brand = useMemo(() => BRAND_STYLES[getBrandKey(company)], [company]);
  const fallbackLabel = useMemo(
    () => (brand.label === 'C' ? getFallbackLabel(company) : brand.label),
    [brand.label, company]
  );

  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-lg ${brand.bg} ${className}`}>
      {src && !hasError ? (
        <img
          src={src}
          alt={alt || company}
          className={imageClassName}
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={`font-semibold ${brand.text} ${labelClassName}`}>
          {fallbackLabel}
        </span>
      )}
    </div>
  );
}
