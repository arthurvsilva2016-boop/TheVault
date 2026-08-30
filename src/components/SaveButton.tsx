import React, { useState } from 'react';
import { Check, Save } from 'lucide-react';

interface SaveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onSave?: () => void | Promise<void>;
  label?: string | React.ReactNode;
  savedLabel?: string;
  isFormSubmit?: boolean;
}

export default function SaveButton({ onSave, label = 'Save Changes', savedLabel = 'Saved', className, isFormSubmit = false, ...props }: SaveButtonProps) {
  const [saved, setSaved] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.onClick) props.onClick(e);
    
    if (onSave) {
      if (!isFormSubmit) e.preventDefault();
      await onSave();
      triggerSaved();
    } else if (isFormSubmit) {
      triggerSaved();
    }
  };

  const triggerSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={className + " flex items-center justify-center transition-all"}
      {...props}
    >
      {saved ? (
        <>
          <Check className="w-4 h-4 mr-1.5" />
          {savedLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
