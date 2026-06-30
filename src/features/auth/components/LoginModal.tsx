import LoginForm from "./LoginForm";

export default function LoginModal() {
  return (
    <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="login-card">
        <div className="login-head">
          <h1 id="login-title">Trading Journal</h1>
          <p className="subhead">Bank Nifty | Nifty 50 | MCX Crude</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
