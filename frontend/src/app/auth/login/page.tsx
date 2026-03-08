export default function LoginPage() {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Welcome back</h1>
                <p className="auth-subtitle">Sign in to Corten AI</p>

                <div className="auth-oauth-buttons">
                    <button className="btn-oauth" id="google-login-btn">
                        Continue with Google
                    </button>
                    <button className="btn-oauth" id="github-login-btn">
                        Continue with GitHub
                    </button>
                </div>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <form className="auth-form">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" placeholder="you@example.com" />

                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" placeholder="••••••••" />

                    <button type="submit" className="btn-primary" id="login-submit-btn">
                        Sign In
                    </button>
                </form>

                <p className="auth-link">
                    Don&apos;t have an account? <a href="/auth/signup">Sign up</a>
                </p>
            </div>
        </div>
    );
}
