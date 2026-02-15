import { ReactNode } from "react";
import { AppView } from "../../../shared/types/app";

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
  const profile = {
    name: "Journal Owner",
    role: "Day Trader",
    initials: "JO",
    status: "Active",
  };

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
      <div className="sidebar-bottom">
        <div className="sidebar-actions">{actions}</div>
        <div className="sidebar-profile">
          <div className="profile-avatar">{profile.initials}</div>
          <div className="profile-meta">
            <strong>{profile.name}</strong>
            <span>{profile.role}</span>
          </div>
          <span className="profile-status">{profile.status}</span>
        </div>
      </div>
    </aside>
  );
}
