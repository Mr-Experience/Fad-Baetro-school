const fs = require('fs');

const files = [
    'src/pages/student/StudentLogin.jsx',
    'src/pages/student/NoExamSchedule.jsx',
    'src/pages/student/ExamSubmitted.jsx',
    'src/pages/student/ExamScreen.jsx',
    'src/pages/student/ActiveExam.jsx',
    'src/pages/candidate/CandidateLogin.jsx',
    'src/pages/candidate/ExamScreen.jsx',
    'src/pages/candidate/ExamSubmitted.jsx',
    'src/pages/candidate/NoExamSchedule.jsx',
    'src/pages/candidate/ActiveExam.jsx',
    'src/pages/admin/AdminCandidates.jsx',
    'src/pages/admin/AdminDashboard.jsx',
    'src/pages/admin/AdminResultDetail.jsx',
    'src/pages/admin/AdminStudents.jsx',
    'src/components/ProtectedRoute.jsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log("File not found:", file);
        continue;
    }
    let content = fs.readFileSync(file, 'utf8');

    // Replace students table target -> profiles table
    content = content.replace(/\.from\('students'\)/g, ".from('profiles')");
    content = content.replace(/\.from\("students"\)/g, '.from("profiles")');

    // For AdminStudents, we need to insert eq('role', 'student') after the select block
    if (file.includes('AdminStudents.jsx')) {
        content = content.replace(
            /(\.select\([^)]*\)\s*\n\s*\.order)/g,
            ".eq('role', 'student')\n                $1"
        );

        // Let's also remove the duplicate profile creation since students IS profiles now
        // In handleAddStudent:
        // We can just keep the profile insert and remove the 'students' insert, but wait, my sed replaced students -> profiles, 
        // so it might result in two inserts to 'profiles'. I'll handle AdminStudents manually.
    }

    if (file.endsWith('AdminDashboard.jsx')) {
        content = content.replace(
            /supabase\.from\('profiles'\)\.select\('\*', \{ count: 'exact', head: true \}\)/g,
            "supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')"
        );
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Processed', file);
}
