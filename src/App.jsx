import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/home/HomePage';
import GalleryPage from './pages/media/GalleryPage';
import EventsPage from './pages/events/EventsPage';
import ContactPage from './pages/contact/ContactPage';
import AboutPage from './pages/school/AboutPage';
import HistoryPage from './pages/school/HistoryPage';
import VisionPage from './pages/school/VisionPage';
import AdmissionProcessPage from './pages/school/AdmissionProcessPage';
import FAQPage from './pages/school/FAQPage';
import NewsPage from './pages/media/NewsPage';
import CandidateLogin from './pages/auth/CandidateLogin';





function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/vision" element={<VisionPage />} />
                <Route path="/process" element={<AdmissionProcessPage />} />
                <Route path="/frequently-asked-questions" element={<FAQPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/news" element={<NewsPage />} />
                {/* Previews & Candidates */}
                <Route path="/portal/candidate" element={<CandidateLogin />} />


                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
