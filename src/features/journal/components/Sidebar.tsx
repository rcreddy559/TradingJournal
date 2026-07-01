import { ReactNode } from "react";
import { AppView } from "../../../shared/types/app";
import { useTheme } from "../../../shared/ui";

interface SidebarItem {
  key: AppView;
  label: string;
}

const items: SidebarItem[] = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "TRADES", label: "Trades" },
  { key: "ADD_TRADE", label: "Add Trade" },
  { key: "STRATEGIES", label: "Strategies" },
  { key: "STRATEGY_ANALYTICS", label: "Strategy Analytics" },
  { key: "PSYCHOLOGY", label: "Psychology" },
  { key: "PROFILE", label: "Profile" },
  { key: "SETTINGS", label: "Settings" },
];

interface SidebarProps {
  active: AppView;
  onChange: (view: AppView) => void;
  userName: string;
  profileName?: string;
  profileRole?: string;
  profileAvatar?: string;
  onLogout: () => void;
  actions?: ReactNode;
}

const getInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/[\s_.-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function Sidebar({
  active,
  onChange,
  userName,
  profileName,
  profileRole,
  profileAvatar,
  onLogout,
  actions,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const displayName = profileName?.trim() || userName || "Journal Owner";
  const profile = {
    name: displayName,
    role: profileRole?.trim() || "Day Trader",
    initials: getInitials(displayName),
    avatar: profileAvatar,
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
        <button
          type="button"
          className="nav-btn theme-toggle"
          onClick={toggleTheme}
          title="Toggle color theme"
        >
          {theme === "dark" ? "\u2600 Light Mode" : "\u263e Dark Mode"}
        </button>
        <div className="sidebar-actions">{actions}</div>
        <button
          type="button"
          className="sidebar-profile"
          onClick={() => onChange("PROFILE")}
          title="View profile"
        >
          <div className="profile-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.name} />
            ) : (
              profile.initials
            )}
          </div>
          <div className="profile-meta">
            <strong>{profile.name}</strong>
            <span>{profile.role}</span>
          </div>
          <span
            role="button"
            tabIndex={0}
            className="logout-btn"
            onClick={(event) => {
              event.stopPropagation();
              onLogout();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.stopPropagation();
                onLogout();
              }
            }}
            title="Log out"
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
