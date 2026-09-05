"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsiblePanel({ title, subtitle, icon, children, collapsedContent, className = "", horizontal = false }: { title: string; subtitle?: string; icon?: ReactNode; children: ReactNode; collapsedContent?: ReactNode; className?: string; horizontal?: boolean }) {
  const [open, setOpen] = useState(true);
  return <div className={`${className} collapsible-sidebar-panel${horizontal ? " collapsible-sidebar-horizontal" : ""}${open ? "" : " is-collapsed"}`}>
    <button type="button" className="collapsible-sidebar-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      {icon && <span className="collapsible-sidebar-icon">{icon}</span>}
      <span><b>{title}</b>{subtitle && <small>{subtitle}</small>}</span>
      <ChevronDown size={17} className={open ? "is-open" : undefined} />
    </button>
    <div className={`collapsible-sidebar-body${open ? " is-open" : ""}`} hidden={!open}>{children}</div>
    {collapsedContent && <div className="collapsible-sidebar-collapsed-icons" hidden={open}>{collapsedContent}</div>}
  </div>;
}
