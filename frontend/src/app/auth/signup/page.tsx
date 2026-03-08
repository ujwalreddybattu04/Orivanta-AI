export default function SignupPage() {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>Create your account</h1>
                <p className="auth-subtitle">Join Corten AI</p>

                <div className="auth-oauth-buttons">
                    <button className="btn-oauth" id="google-signup-btn">
                        Continue with Google
                    </button>
                    <button className="btn-oauth" id="github-signup-btn">
                        Continue with GitHub
                    </button>
                </div>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <form className="auth-form">
                    <label htmlFor="name">Full Name</label>
                    <input type="text" id="name" placeholder="John Doe" />

                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" placeholder="you@example.com" />

                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" placeholder="••••••••" />

                    <button type="submit" className="btn-primary" id="signup-submit-btn">
                        Create Account
                    </button>
                </form>

                <p className="auth-link">
                    Already have an account? <a href="/auth/login">Sign in</a>
                </p>
            </div>
        </div>
    );
}
