---
description: How to add a new student manually via the Admin Portal
---

# Add New Student Workflow

This workflow describes the process of manually adding a new student to the system using the Admin Portal.

## Prerequisites
- Administrator or Super Admin access.
- Supabase Project Settings: **Email Auth** enabled.
- (Optional) Supabase Project Settings: **Confirm Email** disabled (to allow "No Verification" login).

## Steps

### 1. Navigate to Students Page
- Log in to the Admin Portal.
- Click on the **Students** card or navigation link.

### 2. Open Add Student Modal
- Click the **Add Student** button (usually at the top right of the students list).

### 3. Fill in Student Details
- **Email**: Enter a unique email address for the student.
- **Password**: Enter the password the student will use to log in.
- **Full Name**: Enter the student's full name.
- **Class**: Select the appropriate class from the dropdown.
- **Phone Number**: (Optional) Enter the guardian's contact number.
- **Profile Image**: (Optional) Upload a picture for the student.

### 4. Save and Verify
- Click **Save Student**.
- The system will:
    1. Create a user account in Supabase Auth.
    2. Create a profile record in the `profiles` table with the `student` role.
    3. Upload the image (if provided) to the `profile images` storage bucket.
- The student list will update automatically.

## Notes on Authentication
- This operation uses the student's email and password for authentication.
- **No Verification**: For the student to log in immediately without checking their email, ensure that **Confirm Email** is turned **OFF** in your Supabase Auth settings (**Authentication > Providers > Email**).
