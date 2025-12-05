'use client'

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Building2, Webhook as WebhookIcon, LucideIcon } from 'lucide-react';

interface VariablePickerProps {
  onSelect: (variable: string) => void;
  showWebhookVars?: boolean;
}

interface Variable {
  label: string;
  value: string;
  icon: LucideIcon;
  category: string;
  description?: string;
}

export default function VariablePicker({ onSelect, showWebhookVars = false }: VariablePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const variables: Variable[] = [
    { label: 'First Name', value: '{{firstName}}', icon: User, category: 'Lead Data' },
    { label: 'Last Name', value: '{{lastName}}', icon: User, category: 'Lead Data' },
    { label: 'Company', value: '{{company}}', icon: Building2, category: 'Lead Data' },
  ];

  const webhookVars: Variable[] = [
    { label: 'Webhook Custom Field', value: '{{webhookData.fieldName}}', icon: WebhookIcon, category: 'Webhook Data', description: 'Replace "fieldName" with your field' },
  ];

  const allVars = showWebhookVars ? [...variables, ...webhookVars] : variables;

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm rounded-lg flex items-center gap-2 transition-colors"
      >
        Insert Variable
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50">
          <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
            {allVars.map((variable, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(variable.value)}
                className="w-full text-left px-3 py-2 hover:bg-neutral-700 rounded-lg transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <variable.icon className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{variable.label}</div>
                    <div className="text-xs text-gray-400 font-mono">{variable.value}</div>
                    {variable.description && (
                      <div className="text-xs text-gray-500 mt-1">{variable.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-neutral-700 p-3 bg-neutral-800/50">
            <p className="text-xs text-gray-400">
              Variables will be replaced with actual lead data when emails are sent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
