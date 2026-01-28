import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<div>School Management System - Landing Page Placeholder</div>} />
                {/* Future routes: /login, /dashboard, etc. */}
            </Routes>
        </Router>
    );
}

export default App;
