import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, UserCheck, ShieldCheck, ClipboardCheck } from 'lucide-react';
import './PortalQuickAccess.css';

const PortalQuickAccess = () => {
    const portals = [
        {
            title: "Student Portal",
            desc: "Access your dashboard, results and academic progress.",
            icon: <GraduationCap size={32} />,
            link: "/portal/student",
            color: "pink"
        },
        {
            title: "Candidate Portal",
            desc: "Take entrance exams and check admission status.",
            icon: <ClipboardCheck size={32} />,
            link: "/portal/candidate",
            color: "blue"
        },
        {
            title: "Admin Portal",
            desc: "Manage students, classes and school operations.",
            icon: <UserCheck size={32} />,
            link: "/portal/admin/login",
            color: "green"
        },
        {
            title: "Super Admin",
            desc: "System configuration and global management.",
            icon: <ShieldCheck size={32} />,
            link: "/portal/superadmin",
            color: "purple"
        }
    ];

    return (
        <section className="portal-access-section section-padding">
            <div className="container-std">
                <div className="portal-access-header">
                    <span className="subtitle-caps">
                        <span className="subtitle-line"></span>
                        QUICK ACCESS
                    </span>
                    <h2 className="h2-large">SCHOOL PORTALS</h2>
                </div>

                <div className="portal-access-grid">
                    {portals.map((portal, index) => (
                        <Link to={portal.link} key={index} className={`portal-card card-${portal.color}`}>
                            <div className="portal-card-icon">
                                {portal.icon}
                            </div>
                            <div className="portal-card-info">
                                <h3>{portal.title}</h3>
                                <p>{portal.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PortalQuickAccess;
