import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { ExperienceLevel, TraderProfile } from "../types/trade";
import { useJournalActions, useJournalState } from "../store/hooks";
import { generateId, formatDate } from "../../../shared/lib/helpers";
import { useAuth } from "../../auth";
import { useConfirm, useToast } from "../../../shared/ui";

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  PROFESSIONAL: "Professional",
};

interface ProfileFormState {
  fullName: string;
  displayName: string;
  email: string;
  role: string;
  broker: string;
  baseCurrency: string;
  tradingCapital: string;
  riskPerTradePct: string;
  experienceLevel: ExperienceLevel;
  bio: string;
  avatar: string;
}

const buildEmptyForm = (displayName: string): ProfileFormState => ({
  fullName: "",
  displayName,
  email: "",
  role: "Day Trader",
  broker: "",
  baseCurrency: "INR",
  tradingCapital: "",
  riskPerTradePct: "",
  experienceLevel: "INTERMEDIATE",
  bio: "",
  avatar: "",
});

const toFormState = (profile: TraderProfile): ProfileFormState => ({
  fullName: profile.fullName,
  displayName: profile.displayName,
  email: profile.email,
  role: profile.role,
  broker: profile.broker,
  baseCurrency: profile.baseCurrency,
  tradingCapital:
    profile.tradingCapital > 0 ? String(profile.tradingCapital) : "",
  riskPerTradePct:
    profile.riskPerTradePct > 0 ? String(profile.riskPerTradePct) : "",
  experienceLevel: profile.experienceLevel,
  bio: profile.bio,
  avatar: profile.avatar ?? "",
});

const getInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/[\s_.-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ProfilePage() {
  const { profile } = useJournalState();
  const { saveProfile, deleteProfile } = useJournalActions();
  const { user } = useAuth();
  const { notify } = useToast();
  const confirm = useConfirm();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const seedName = user?.username ?? "";
  // When a profile exists we start in read-only view; otherwise we open the
  // create form immediately so first-time users can set themselves up.
  const [isEditing, setIsEditing] = useState(!profile);
  const [form, setForm] = useState<ProfileFormState>(
    profile ? toFormState(profile) : buildEmptyForm(seedName),
  );
  const [formError, setFormError] = useState("");

  const isCreating = !profile;

  const derivedCapital = useMemo(() => {
    const capital = Number(form.tradingCapital || 0);
    const riskPct = Number(form.riskPerTradePct || 0);
    if (capital <= 0 || riskPct <= 0) return null;
    return (capital * riskPct) / 100;
  }, [form.tradingCapital, form.riskPerTradePct]);

  const setField = <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please choose an image file for your avatar.", "error");
      event.target.value = "";
      return;
    }
    if (file.size > 1_500_000) {
      notify("Avatar is too large. Choose an image under 1.5 MB.", "error");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setField(
        "avatar",
        typeof reader.result === "string" ? reader.result : "",
      );
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const displayName = form.displayName.trim();
    const email = form.email.trim();

    if (!fullName) {
      setFormError("Full name is required.");
      return;
    }
    if (!displayName) {
      setFormError("Display name is required.");
      return;
    }
    if (email && !isValidEmail(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    const now = new Date().toISOString();
    const nextProfile: TraderProfile = {
      id: profile?.id ?? generateId(),
      fullName,
      displayName,
      email,
      role: form.role.trim() || "Trader",
      broker: form.broker.trim(),
      baseCurrency: form.baseCurrency.trim().toUpperCase() || "INR",
      tradingCapital: Math.max(0, Number(form.tradingCapital || 0)),
      riskPerTradePct: Math.max(0, Number(form.riskPerTradePct || 0)),
      experienceLevel: form.experienceLevel,
      bio: form.bio.trim(),
      avatar: form.avatar || undefined,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };

    saveProfile(nextProfile);
    setFormError("");
    setIsEditing(false);
    notify(isCreating ? "Profile created." : "Profile updated.", "success");
  };

  const handleEdit = () => {
    if (profile) setForm(toFormState(profile));
    setFormError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (profile) {
      setForm(toFormState(profile));
      setIsEditing(false);
    }
    setFormError("");
  };

  const handleDelete = async () => {
    if (!profile) return;
    const confirmed = await confirm({
      title: "Delete profile",
      message:
        "Delete your trader profile? Your trades and strategies are kept, but profile details will be cleared.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    deleteProfile();
    setForm(buildEmptyForm(seedName));
    setIsEditing(true);
    notify("Profile deleted.", "success");
  };

  const previewInitials = getInitials(form.displayName || seedName || "Trader");

  return (
    <section className="page profile-page">
      <h2>Profile</h2>

      {profile && !isEditing ? (
        <div className="profile-view">
          <div className="profile-card">
            <div className="profile-card-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.displayName} />
              ) : (
                <span>{getInitials(profile.displayName)}</span>
              )}
            </div>
            <div className="profile-card-body">
              <h3>{profile.displayName}</h3>
              <p className="profile-card-role">
                {profile.role} &middot;{" "}
                {EXPERIENCE_LABELS[profile.experienceLevel]}
              </p>
              {profile.fullName && (
                <p className="subtext">{profile.fullName}</p>
              )}
              {profile.email && <p className="subtext">{profile.email}</p>}
              {profile.bio && <p className="profile-card-bio">{profile.bio}</p>}
            </div>
            <div className="profile-card-actions">
              <button type="button" onClick={handleEdit}>
                Edit Profile
              </button>
              <button type="button" className="danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat-label">Broker</span>
              <strong>{profile.broker || "-"}</strong>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Trading Capital</span>
              <strong>
                {profile.tradingCapital > 0
                  ? `${profile.baseCurrency} ${profile.tradingCapital.toLocaleString(
                      "en-IN",
                    )}`
                  : "-"}
              </strong>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Risk / Trade</span>
              <strong>
                {profile.riskPerTradePct > 0
                  ? `${profile.riskPerTradePct}%`
                  : "-"}
              </strong>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Risk Amount</span>
              <strong>
                {profile.tradingCapital > 0 && profile.riskPerTradePct > 0
                  ? `${profile.baseCurrency} ${(
                      (profile.tradingCapital * profile.riskPerTradePct) /
                      100
                    ).toLocaleString("en-IN")}`
                  : "-"}
              </strong>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Member Since</span>
              <strong>{formatDate(profile.createdAt)}</strong>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Last Updated</span>
              <strong>{formatDate(profile.updatedAt)}</strong>
            </div>
          </div>
        </div>
      ) : (
        <form className="form-card profile-form" onSubmit={handleSubmit}>
          <h3>{isCreating ? "Create Your Profile" : "Edit Profile"}</h3>
          {formError && <p className="warning">{formError}</p>}

          <div className="profile-avatar-editor">
            <div className="profile-card-avatar">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar preview" />
              ) : (
                <span>{previewInitials}</span>
              )}
            </div>
            <div className="profile-avatar-controls">
              <button
                type="button"
                className="secondary"
                onClick={() => avatarInputRef.current?.click()}
              >
                {form.avatar ? "Change Avatar" : "Upload Avatar"}
              </button>
              {form.avatar && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setField("avatar", "")}
                >
                  Remove
                </button>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden-input"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div className="profile-form-grid">
            <label>
              Full Name
              <input
                value={form.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                placeholder="Jane Trader"
                required
              />
            </label>
            <label>
              Display Name
              <input
                value={form.displayName}
                onChange={(event) =>
                  setField("displayName", event.target.value)
                }
                placeholder="Jane"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="jane@example.com"
              />
            </label>
            <label>
              Role / Title
              <input
                value={form.role}
                onChange={(event) => setField("role", event.target.value)}
                placeholder="Day Trader"
              />
            </label>
            <label>
              Experience Level
              <select
                value={form.experienceLevel}
                onChange={(event) =>
                  setField(
                    "experienceLevel",
                    event.target.value as ExperienceLevel,
                  )
                }
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="PROFESSIONAL">Professional</option>
              </select>
            </label>
            <label>
              Broker
              <input
                value={form.broker}
                onChange={(event) => setField("broker", event.target.value)}
                placeholder="Zerodha"
              />
            </label>
            <label>
              Base Currency
              <input
                value={form.baseCurrency}
                onChange={(event) =>
                  setField("baseCurrency", event.target.value)
                }
                placeholder="INR"
                maxLength={5}
              />
            </label>
            <label>
              Trading Capital
              <input
                type="number"
                min={0}
                value={form.tradingCapital}
                onChange={(event) =>
                  setField("tradingCapital", event.target.value)
                }
                placeholder="100000"
              />
            </label>
            <label>
              Risk Per Trade (%)
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.riskPerTradePct}
                onChange={(event) =>
                  setField("riskPerTradePct", event.target.value)
                }
                placeholder="1"
              />
            </label>
          </div>

          <label>
            Bio
            <textarea
              value={form.bio}
              onChange={(event) => setField("bio", event.target.value)}
              rows={3}
              placeholder="Your trading style, markets, and goals."
            />
          </label>

          {derivedCapital !== null && (
            <p className="subtext">
              Risk budget per trade:{" "}
              <strong>
                {form.baseCurrency.trim().toUpperCase() || "INR"}{" "}
                {derivedCapital.toLocaleString("en-IN")}
              </strong>
            </p>
          )}

          <div className="form-actions">
            <button type="submit">
              {isCreating ? "Create Profile" : "Save Changes"}
            </button>
            {!isCreating && (
              <button
                type="button"
                className="secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
