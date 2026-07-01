import { FormEvent, useState } from "react";
import { useAuth } from "../store/authContext";

interface LoginFormProps {
  onSuccess?: () => void;
}

const NEW_USER_VALUE = "__new__";

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, knownUsers, forgetUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState(
    knownUsers[0] ?? NEW_USER_VALUE,
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isNewUser = knownUsers.length === 0 || selectedUser === NEW_USER_VALUE;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = (isNewUser ? username : selectedUser).trim();

    if (!name) {
      setError(
        isNewUser
          ? "Please enter a username to continue."
          : "Please select a user to continue.",
      );
      return;
    }

    setError("");
    login(name);
    onSuccess?.();
  };

  const handleForget = () => {
    if (isNewUser) return;
    const remaining = knownUsers.filter((user) => user !== selectedUser);
    forgetUser(selectedUser);
    setSelectedUser(remaining[0] ?? NEW_USER_VALUE);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {knownUsers.length > 0 && (
        <label>
          Existing user
          <div className="login-user-row">
            <select
              value={selectedUser}
              onChange={(event) => {
                setError("");
                setSelectedUser(event.target.value);
              }}
            >
              {knownUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
              <option value={NEW_USER_VALUE}>+ New user…</option>
            </select>
            {!isNewUser && (
              <button
                type="button"
                className="secondary login-forget-btn"
                onClick={handleForget}
                title="Remove this user from the list"
              >
                Forget
              </button>
            )}
          </div>
        </label>
      )}

      {isNewUser && (
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
      )}

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
        {isNewUser ? "Create & sign in" : "Sign in"}
      </button>

      <p className="login-hint">
        Your trades stay on this device. Each username keeps a separate journal.
      </p>
    </form>
  );
}
