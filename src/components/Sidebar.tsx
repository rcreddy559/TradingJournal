import { ReactNode } from "react";

export type AppView = "DASHBOARD" | "ADD_TRADE" | "TRADES" | "STRATEGIES" | "SETTINGS";

interface SidebarItem {
  key: AppView;
  label: string;
}

const items: SidebarItem[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "TRADES", label: "Trades" },
  { key: "ADD_TRADE", label: "Add Trade" },
  { key: "STRATEGIES", label: "Strategies" },
  { key: "SETTINGS", label: "Settings" }
];

interface SidebarProps {
  active: AppView;
  onChange: (view: AppView) => void;
  actions?: ReactNode;
}

export default function Sidebar({ active, onChange, actions }: SidebarProps) {
  return (
    <aside className="sidebar">
      <h1>Trading Journal</h1>
      <p className="subhead">Bank Nifty | Nifty 50 | MCX Crude</p>
      <nav>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={active === item.key ? "nav-btn active" : "nav-btn"}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-actions">{actions}</div>
    </aside>
  );
}
