- [x] Implement dual-mode navigation overlay (Quick Links grid for desktop, Drawer for mobile)
- [x] Update Quick Links grid items (Home, Our School, Event, Admission, Media, Contact)
- [x] Fix broken image imports in internal pages (Vision, About, History)
- [x] Create dedicated hero_slides folder and migrate 2 images
- [x] Update Hero section to pick from the new folder and centralized alignment
- [x] Remove "Curriculum" from Footer academics section
- [x] Update browser tab title to "Fad Maestro Academy"
- [x] Create transparent PNG logo and set as browser favicon
- [x] Standardize image loading using React imports for reliability
- [x] Cleanup 5 unused old image assets
- [x] Hide Gemini logo watermarks using global .watermark-crop CSS
- [x] Permanently Removed Student Portal: Deleted all files, routes, and logic related to students
- [x] Permanently Removed Staff/Admin Portal: Deleted all files, routes, and logic related to staff and admin
- [x] Cleaned Folder Structure: Removed redundant contexts (Auth, Toast), empty directories, and debug utilities
- [x] Refine Header: Reduce logo/text size and ensure symmetrical vertical centering
- [x] Preview pages- [x] Inspect current spacing between header and login form <!-- id: 0 -->
- [x] Adjust CSS to achieve exact 24px spacing <!-- id: 1 -->
- [ ] Investigate "Preview local storage in link" request <!-- id: 3 -->
- [ ] Verify fix at 100% zoom and across zoom levels <!-- id: 2 -->
- [x] Implement Design-Only Login Screens: Created Staff and Student login UI matching pixel-perfect requirements (No functionality)

## Phase 2: Page Integration & Linking
- [x] 1. **Auth Redirects**: Verify Login redirects to correct Dashboards based on role.
- [x] 2. **Logout Logic**: Add Logout button/functionality to Dashboard layouts.
- [x] 3. **Student Dashboard Metrics**: Fetch real stats (Subjects, Attendance) from backend.
- [x] 4. **Student Timetable**: Connect `StudentTimetable.jsx` to `get_timetable.php`.
- [x] 5. **Student Profile**: Connect `StudentProfile.jsx` to fetch user data.
- [x] 6. **Teacher Dashboard Metrics**: Fetch real stats for teachers.
- [x] 7. **Teacher Subjects**: Link `TeacherSubjects.jsx` to assigned subjects.
- [x] 8. **Admin User Lists**: Connect `AdminStudents` & `AdminTeachers` to backend lists.
- [ ] 9. **Admin Classes**: Implement Class management (Fetch/Create) on `AdminClasses.jsx`.
- [x] 11. **Portal Preview**: Verify staff and student portal access.
- [x] 16. **Student Exam Backend**: Implement database tables and API logic for active exams.
- [x] 17. **Take Exam Interface**: Implement the question interface and submission logic.
- [x] 18. **Admin Exam Config**: Implement exam settings (Time, Duration, Visibility) in `AddQuestion.jsx`.
## Phase 3: Core Database Rebuild & Auth
- [x] 1. **User Table**: Create centralized `users` table with roles (superadmin, admin, student, candidate).
- [x] 2. **Profile Tables**: Create dedicated tables for `superadmins`, `admins`, `students`, and `candidates`.
- [x] 3. **Initial Seeding**: Create one account for each role (school.com domain, Fad2026 password).
- [x] 4. **Auth Refactor**: Update `login.php` to handle the new table structure if necessary.

## Phase 4: Infrastructure & Exam System Restoration
- [x] 1. **Infrastructure**: Recreate `classes`, `subjects`, `sessions`, `school_settings`.
- [x] 2. **Exam Subsystem**: Recreate `exams`, `exam_questions`, `exam_submissions`, `exam_answers`.
- [x] 3. **Verification**: Verify all portals (Admin, Student, Candidate) can access data.
