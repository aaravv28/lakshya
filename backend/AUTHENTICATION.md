# Lakshya Authentication

Authentication uses bcryptjs password hashes and JWTs. The JWT secret is read from `JWT_SECRET` in `.env`; change the development value before production use.

## Initialize development passwords

From `backend/`, run:

```sh
npm run seed:demo-passwords
```

The script only updates the `password` field on existing records. It never creates, deletes, or replaces accounts.

Initialized development credentials:

- Student 24ITUOZ009: `24ituoz009@ddu.ac.in` / `LakshyaStudent@123`
- Recruiter REC001: `rahul@google.com` / `LakshyaRecruiter@123`
- Placement Officer PO001: `jatayubaxi.ce@ddu.ac.in` / `LakshyaOfficer@123`

## Login

`POST /api/auth/login` accepts `email`, `password`, and one of `student`, `recruiter`, or `officer`. Successful responses contain a JWT, role, and password-free user identity. Protected API requests must send `Authorization: Bearer <token>`.

The frontend stores the session in local storage for this semester demo. A production deployment should evaluate secure, appropriately scoped cookie-based session storage for its threat model.

## Student identifier

Students are identified by their enrollment number only (stored in capitals, e.g. `24ITUOZ009`). It is the login identity and what applications, notifications, projects and resumes link to (their `studentId` field holds the enrollment number). It cannot be changed after the student is created. Databases created before this change are converted with `node scripts/migrateStudentIdToEnrollmentNo.js` (dry run) and `--apply`.
