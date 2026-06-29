import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  loading: externalLoading = false,
  disabled = false,
  loadingText,
  icon,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const loading = externalLoading || internalLoading;

  const handleClick = async (e) => {
    if (!onClick) return;
    const result = onClick(e);
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const baseStyle = "flex items-center justify-center gap-2 transition-all duration-150 font-extrabold rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none";
  
  const variants = {
    primary: "bg-brand-green text-white btn-3d shadow-3d-green hover:brightness-110",
    secondary: "bg-brand-purple text-white btn-3d shadow-3d-purple hover:brightness-110",
    blue: "bg-brand-blue text-white btn-3d shadow-3d-blue hover:brightness-110",
    danger: "bg-brand-red text-white btn-3d shadow-3d-red hover:brightness-110",
    outline: "bg-white dark:bg-bg-card border-2 border-brand-gray text-text-main btn-3d shadow-3d-card hover:bg-brand-light",
    ghost: "bg-transparent text-text-main hover:bg-brand-gray/10",
    custom: "" // Allows complete styling via className
  };

  const sizes = {
    sm: "py-2 px-4 text-xs",
    md: "py-3 px-6 text-sm",
    lg: "py-4 px-8 text-base",
    custom: ""
  };

  const variantStyle = variants[variant] !== undefined ? variants[variant] : variants.primary;
  const sizeStyle = sizes[size] !== undefined ? sizes[size] : sizes.md;

  const displayText = loadingText ? loadingText : (typeof children === 'string' ? `${children}...` : 'Loading...');

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />
          {displayText}
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
