import { FormEvent, useState } from "react";
import { useAuth } from "../store/authContext";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = username.trim();

    if (!trimmed) {
      setError("Please enter a username to continue.");
      return;
    }

    setError("");
    login(trimmed);
    onSuccess?.();
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label>
        Username
        <input
          type="text"
          value={username}
          autoFocus
          placeholder="e.g. ravi_trader"
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>

      <label>
        Password
        <input
          type="password"
          value={password}
          placeholder="Optional for local journal"
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error && <p className="login-error">{error}</p>}

      <button type="submit" className="login-submit">
        Sign in
      </button>

      <p className="login-hint">
        Your trades stay on this device. Each username keeps a separate journal.
      </p>
    </form>
  );
}
