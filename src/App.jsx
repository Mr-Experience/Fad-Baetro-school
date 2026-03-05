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
import SuperadminLogin from './pages/superadmin/SuperadminLogin';
import SchoolConfig from './pages/superadmin/SchoolConfig';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminQuestionEditor from './pages/admin/AdminQuestionEditor';
import AdminResults from './pages/admin/AdminResults';
import AdminInfo from './pages/admin/AdminInfo';
import AdminProfile from './pages/admin/AdminProfile';
import AdminLogin from './pages/admin/AdminLogin';
import CandidateLogin from './pages/candidate/CandidateLogin';
import CandidateNoExam from './pages/candidate/NoExamSchedule';
import CandidateActiveExam from './pages/candidate/ActiveExam';
import CandidateExamScreen from './pages/candidate/ExamScreen';
import CandidateSubmitted from './pages/candidate/ExamSubmitted';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

import StudentLogin from './pages/student/StudentLogin';
import NoExamSchedule from './pages/student/NoExamSchedule';
import ActiveExam from './pages/student/ActiveExam';
import ExamScreen from './pages/student/ExamScreen';
import ExamSubmitted from './pages/student/ExamSubmitted';





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
                {/* Superadmin Pages */}
                <Route path="/portal/superadmin" element={<SuperadminLogin />} />

                {/* Protected Superadmin Routes */}
                <Route element={<ProtectedRoute requiredRole="super_admin" />}>
                    <Route path="/portal/superadmin/config" element={<SchoolConfig />} />
                </Route>

                {/* Admin Pages */}
                <Route path="/portal/admin/login" element={<AdminLogin />} />

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute requiredRole="admin" />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/portal/admin" element={<AdminDashboard />} />
                        <Route path="/portal/admin/students" element={<AdminStudents />} />
                        <Route path="/portal/admin/questions" element={<AdminQuestions />} />
                        <Route path="/portal/admin/questions/editor" element={<AdminQuestionEditor />} />
                        <Route path="/portal/admin/results" element={<AdminResults />} />
                        <Route path="/portal/admin/info" element={<AdminInfo />} />
                        <Route path="/portal/admin/profile" element={<AdminProfile />} />
                    </Route>
                </Route>

                {/* Candidate Pages */}
                <Route path="/portal/candidate" element={<CandidateLogin />} />
                <Route path="/portal/candidate/no-exam" element={<CandidateNoExam />} />
                <Route path="/portal/candidate/active-exam" element={<CandidateActiveExam />} />
                <Route path="/portal/candidate/exam" element={<CandidateExamScreen />} />
                <Route path="/portal/candidate/submitted" element={<CandidateSubmitted />} />

                {/* Student Pages */}
                <Route path="/portal/student" element={<StudentLogin />} />

                {/* Protected Student Routes */}
                <Route element={<ProtectedRoute requiredRole="student" />}>
                    <Route path="/portal/student/no-exam" element={<NoExamSchedule />} />
                    <Route path="/portal/student/active-exam" element={<ActiveExam />} />
                    <Route path="/portal/student/exam" element={<ExamScreen />} />
                    <Route path="/portal/student/submitted" element={<ExamSubmitted />} />
                </Route>


                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
