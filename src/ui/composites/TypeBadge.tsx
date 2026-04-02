import React from 'react';
import { FileText, FlaskConical, HelpCircle, LucideIcon } from 'lucide-react';
import Badge from '../primitives/Badge';

interface TypeConfig {
  label: string;
  variant: 'theory' | 'practice' | 'default' | 'pending' | 'completed' | 'live' | 'morning' | 'afternoon' | 'evening' | 'warning' | 'danger' | 'info';
  Icon: LucideIcon;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  LT: {
    label: "LT",
    variant: "theory",
    Icon: FileText,
  },
  TH: {
    label: "TH",
    variant: "practice",
    Icon: FlaskConical,
  },
};

const FALLBACK_CONFIG: TypeConfig = {
  label: "?",
  variant: "default",
  Icon: HelpCircle,
};

const warnedTypes = new Set<string>();

interface TypeBadgeProps {
  type?: string;
  compact?: boolean;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, compact }) => {
  const normalizedType = typeof type === "string" ? type.trim().toUpperCase() : "";

  const config = TYPE_CONFIG[normalizedType] || FALLBACK_CONFIG;

  if (
    !TYPE_CONFIG[normalizedType] &&
    normalizedType &&
    process.env.NODE_ENV === "development"
  ) {
    if (!warnedTypes.has(normalizedType)) {
      console.warn("Unknown course type:", normalizedType);
      warnedTypes.add(normalizedType);
    }
  }

  const sizeClass = compact ? "text-[9px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  const iconSize = compact ? 10 : 14;
  const gapClass = compact ? "gap-0.5" : "gap-1";

  return (
    <Badge variant={config.variant} className={sizeClass}>
      <span className={`inline-flex items-center ${gapClass}`}>
        <config.Icon size={iconSize} />
        <span>{config.label}</span>
      </span>
    </Badge>
  );
};

export default TypeBadge;
