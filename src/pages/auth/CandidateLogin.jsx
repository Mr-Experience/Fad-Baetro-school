import React from 'react';
import '../auth/PortalLogin.css';
import logo from '../../assets/logo.jpg';

const CandidateLogin = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    return (
        <div className="portal-login-container">
            <header className="portal-header-bar">
                <img src={logo} alt="Logo" className="portal-logo-img" />
                <h1 className="portal-school-name">Fad Maestro Academy</h1>
            </header>

            <main className="portal-content">
                <div className="login-card">
                    <h2 className="login-title">Login to candidate portal</h2>

                    <form className="login-form" onSubmit={(e) => e.preventDefault()} autoComplete="off">
                        <div className="form-group">
                            <label className="form-label">Exam Number*</label>
                            <input
                                type="text"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                                className="form-input"
                                placeholder="Enter your exam number"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Access Pin*</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                className="form-input"
                                placeholder="Enter your access pin"
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn">
                            Login to portal
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default CandidateLogin;
