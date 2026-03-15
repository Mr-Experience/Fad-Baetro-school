import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../auth/PortalLogin.css';
import './DepartmentSelection.css';
import logo from '../../assets/logo.jpg';
import { GraduationCap, FlaskConical, Palette, Landmark, CheckCircle2 } from 'lucide-react';

const DepartmentSelection = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [student, setStudent] = useState(null);
    const [classes, setClasses] = useState([]);
    const [selectedDept, setSelectedDept] = useState(null); // 'ART', 'COM', 'SCI'

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/portal/student');
                return;
            }

            const [profileRes, classesRes] = await Promise.all([
                supabase.from('profiles').select('*, classes(class_name)').eq('id', user.id).single(),
                supabase.from('classes').select('*')
            ]);

            if (profileRes.data?.classes?.class_name !== 'JSS 3') {
                navigate('/portal/student/no-exam');
                return;
            }

            setStudent(profileRes.data);
            setClasses(classesRes.data || []);
            setLoading(false);
        };
        checkStatus();
    }, [navigate]);

    const handleConfirmSelection = async () => {
        if (!selectedDept) return;
        setSaving(true);

        try {
            const targetClassName = `SSS 1 ${selectedDept}`;
            const targetClass = classes.find(c => c.class_name === targetClassName);

            if (!targetClass) {
                throw new Error(`Target class ${targetClassName} not found in system.`);
            }

            const { error } = await supabase
                .from('profiles')
                .update({ class_id: targetClass.id })
                .eq('id', student.id);

            if (error) throw error;

            alert(`Congratulations! You have been successfully promoted to ${targetClassName}.`);
            navigate('/portal/student/no-exam');
        } catch (err) {
            alert("Selection failed: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="ds-loading">
                <div className="aq-spinner-mini"></div>
                <p>Preparing your promotion track...</p>
            </div>
        );
    }

    return (
        <div className="portal-login-container ds-outer">
            <header className="portal-header-bar ds-header">
                <img src={logo} alt="Logo" className="portal-logo-img" />
                <h1 className="portal-school-name">Advancement Portal</h1>
            </header>

            <main className="ds-content">
                <div className="ds-card">
                    <div className="ds-hero">
                        <GraduationCap className="ds-hero-icon" size={48} />
                        <h2 className="ds-title">Level Up to Senior School</h2>
                        <p className="ds-subtitle">
                            Congratulations on completing your Junior secondary education, <strong>{student?.full_name}</strong>. 
                            It is time to choose your specialization path for <strong>SSS 1</strong>.
                        </p>
                    </div>

                    <div className="ds-options">
                        <div 
                            className={`ds-option ${selectedDept === 'SCI' ? 'active' : ''}`}
                            onClick={() => setSelectedDept('SCI')}
                        >
                            <div className="ds-option-icon sci">
                                <FlaskConical size={32} />
                            </div>
                            <div className="ds-option-info">
                                <h3>Science Department</h3>
                                <p>For aspiring Doctors, Engineers, and Tech innovators.</p>
                            </div>
                            {selectedDept === 'SCI' && <CheckCircle2 className="ds-check" size={24} />}
                        </div>

                        <div 
                            className={`ds-option ${selectedDept === 'ART' ? 'active' : ''}`}
                            onClick={() => setSelectedDept('ART')}
                        >
                            <div className="ds-option-icon art">
                                <Palette size={32} />
                            </div>
                            <div className="ds-option-info">
                                <h3>Arts Department</h3>
                                <p>For creative minds, Lawyers, and Linguists.</p>
                            </div>
                            {selectedDept === 'ART' && <CheckCircle2 className="ds-check" size={24} />}
                        </div>

                        <div 
                            className={`ds-option ${selectedDept === 'COM' ? 'active' : ''}`}
                            onClick={() => setSelectedDept('COM')}
                        >
                            <div className="ds-option-icon com">
                                <Landmark size={32} />
                            </div>
                            <div className="ds-option-info">
                                <h3>Commercial Department</h3>
                                <p>For future Economists, Accountants, and Entrepreneurs.</p>
                            </div>
                            {selectedDept === 'COM' && <CheckCircle2 className="ds-check" size={24} />}
                        </div>
                    </div>

                    <div className="ds-footer">
                        <button 
                            className="ds-confirm-btn" 
                            disabled={!selectedDept || saving}
                            onClick={handleConfirmSelection}
                        >
                            {saving ? 'Processing Promotion...' : `Proceed to SSS 1 ${selectedDept || ''}`}
                        </button>
                        <p className="ds-warning">Note: This choice is permanent and will update your official records.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DepartmentSelection;
