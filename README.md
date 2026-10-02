# VoteSecure — Online Voting Management System

A complete, professional, and accessible **Online Voting Management System** browser-based application built strictly with beginner-friendly web technologies: **HTML5, modern CSS3, vanilla JavaScript (ES6+), and browser LocalStorage**.

Designed and structured specifically for academic college projects, university lab assessments, and technical viva examinations.

---

## 📌 1. Project Concept & Architecture

**VoteSecure** models an authentic institutional election management system engineered for collegiate student councils, university departments, and community organizations.

The system features **exactly two types of users**:

```
                       ┌───────────────────────────────────────────┐
                       │          SYSTEM ADMINISTRATOR             │
                       │   (Full Authority Over All Entities)      │
                       └─────────────────────┬─────────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
       [VOTER MANAGEMENT]           [CANDIDATE & POSTS]           [ELECTION CONTROL]
   • Manually enters every voter   • Creates executive posts     • Configures start/end dates
   • Full personal & academic info • Uploads candidate photos    • Sets Upcoming/Active/Completed
   • Assigns User ID & Password    • Uploads campaign symbols    • Controls results publishing
   • Activates / Deactivates       • Approves nominations        • Generates audit & CSV reports
               │
               ▼ (Admin issues User ID & Password)
       ┌───────────────────────────────────────────────────────────┐
       │                   STUDENT VOTER / USER                    │
       │            (Zero Self-Registration Allowed)               │
       └─────────────────────────────┬─────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
   [VOTER LOGIN]             [CONFIDENTIAL BALLOT]       [DIGITAL RECEIPT]
 • Enters User ID & Pass    • 1 vote per contested post  • Confirmation code
 • No registration links    • Modal ballot review check  • Secret ballot stored
 • Direct admin contact     • Duplicate vote blocked     • Printable receipt
```

---

## 🔒 2. Very Important User Creation Rule (Zero Self-Registration)

> [!IMPORTANT]
> **Strict Institutional Security Rule**: In VoteSecure, **voters cannot register themselves**.
> - There is **NO voter registration page**, **NO sign-up form**, **NO "Create Account" link**, and **NO "Forgot Password" link** on the voter portal.
> - The administrator manually verifies voter eligibility (enrollment, student ID, department, year, section) and enters all voter records into the system.
> - The administrator directly issues the **User ID** and **Password** to the student.
> - If an unauthorized user visits the voter login page, they are presented only with the User ID and Password fields and the official notice:
>   > *"Don't have your login credentials? Please contact the administrator to receive your User ID and password."*

---

## 🔑 3. Demo Credentials

### Administrator Portal
* **URL**: [`pages/admin-login.html`](pages/admin-login.html)
* **Username**: `admin`
* **Password**: `Admin@123`
* **Authority**: Full administrative control over voters, candidates, posts, elections, results, and reports.

### Voter Portal
* **URL**: [`pages/voter-login.html`](pages/voter-login.html)

| User ID | Password | Voter Full Name | Department | Academic Year | Account Status | Ballot State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `VOTER001` | `voter123` | **Rahul Kumar** | Computer Science | 3rd Year (Sec A) | <span style="color:green">● Active</span> | **Ready to Vote (Uncast)** |
| `VOTER002` | `voter456` | **Priya Sharma** | Information Technology | 3rd Year (Sec B) | <span style="color:green">● Active</span> | **Ready to Vote (Uncast)** |
| `VOTER003` | `voter789` | **Arjun Rao** | Electronics & Comm. | 4th Year (Sec A) | <span style="color:green">● Active</span> | **Already Voted (Duplicate Check)** |
| `VOTER004` | `voter101` | **Sneha Patel** | Civil Engineering | 2nd Year (Sec C) | <span style="color:green">● Active</span> | **Ready to Vote (Uncast)** |
| `VOTER005` | `voter202` | **Karthik Verma** | Mechanical Engg. | 4th Year (Sec A) | <span style="color:red">● Inactive</span> | **Account Deactivated (Blocked)** |

> **Convenience Feature**: Both the Voter and Admin login pages include **Quick Fill** buttons so you can test every scenario during demonstrations without typing.

---

## 🛠️ 4. Technologies Used

VoteSecure is built **100% framework-free** using core web standards:

| Technology | Purpose in Project |
| :--- | :--- |
| **HTML5** | Semantic structure (`<header>`, `<main>`, `<section>`, `<aside>`, `<nav>`, `<table>`, `<form>`, file inputs) |
| **CSS3** | Modern styling, CSS variables, CSS Grid, Flexbox, transitions, animated bar charts, `@media print` rules |
| **Vanilla JavaScript (ES6+)** | DOM manipulation, state management, form validation, event delegation, search/filter algorithms |
| **Browser LocalStorage** | Client-side persistent key-value storage engine (simulating a database) |
| **JSON** | Initial seed data schema (`data/demo-data.json`) loaded on first system launch |
| **Scalable Vector Graphics (SVG)** | Crisp electoral symbol icons (Torch, Sun, Star, Book, Shield, Pen, Compass) and candidate portraits |
| **Git / GitHub** | Clean version control, modular commit structure, and project documentation |

> **STRICT COMPLIANCE**: Zero external frameworks or libraries used. No React, Vue, Angular, Next.js, Node.js, Express, PHP, Python, Java, MySQL, MongoDB, or Bootstrap.

---

## 📂 5. Project Directory Structure

```text
online-voting-system/
│
├── index.html                   # Professional public landing page (Hero, Features, About, Contact)
├── README.md                    # Comprehensive project documentation & viva examination guide
├── .gitignore                   # Standard git ignore patterns
│
├── pages/                       # Modular web application pages
│   ├── admin-login.html         # Administrator authentication portal
│   ├── voter-login.html         # Voter login screen (strictly credentials only)
│   ├── admin-dashboard.html     # Admin command center (metrics, status, activity logs)
│   ├── elections.html           # Election lifecycle management (start/stop/schedule)
│   ├── posts.html               # Executive positions/posts management
│   ├── voters.html              # Full voter directory (4-part registration, search, filter)
│   ├── candidates.html          # Candidate cards (photo upload, symbol upload, preview)
│   ├── results.html             # Dynamic real-time vote tally, pure CSS bar charts & winner badges
│   ├── reports.html             # 6 dynamic reports, screen preview, print layout & CSV exports
│   ├── settings.html            # Admin profile, change password, results visibility & reset data
│   ├── voter-dashboard.html     # Voter personalized hub (greeting, election status, Vote Now)
│   ├── voting.html              # Confidential electronic ballot & Review Vote modal dialog
│   └── profile.html             # Voter institutional profile & voting history receipt ledger
│
├── css/                         # Clean modular stylesheets
│   ├── style.css                # Global design system, colors, buttons, forms, tables, modals, toasts
│   ├── login.css                # Centered login card layouts, input icons & demo credentials box
│   ├── dashboard.css            # Sidebar layout, topbar, stats grid, CSS progress bars, winner tags
│   ├── voting.css               # Candidate ballot cards, radio select indicator, review summary
│   └── responsive.css           # Media queries for desktop, tablet, and mobile displays
│
├── js/                          # Vanilla ES6+ application scripts
│   ├── storage.js               # Centralized LocalStorage manager, CRUD, duplicate check & demo seed
│   ├── auth.js                  # Authentication, role protection (admin/voter), session & simulated logout
│   ├── utils.js                 # Toast notifications, confirmation modals, formatters, CSV blob export
│   ├── app.js                   # Landing page interactions & mobile drawer toggle
│   ├── admin.js                 # Admin dashboard statistics calculation & live chart preview
│   ├── elections.js             # Election CRUD, schedule validation & Start/Stop controls
│   ├── posts.js                 # Position/post CRUD, candidate assignment & ordering
│   ├── voters.js                # Voter CRUD, 4-tier form validation, search, filter & toggle status
│   ├── candidates.js            # Candidate cards, Base64 FileReader photo/symbol upload & preview
│   ├── results.js               # Dynamic vote tallying, pure CSS percentage calculations & access gate
│   ├── reports.js               # 6 dynamic report renderers, CSV blob exporter & print triggers
│   ├── settings.js              # Admin profile update, change password & public results visibility
│   ├── voter.js                 # Voter dashboard controller, greeting & active election status
│   ├── voting.js                # Single candidate per post selection, review modal, duplicate block
│   └── profile.js               # Voter details display, audit history & modal confirmation receipt
│
├── assets/
│   ├── images/                  # VoteSecure logo and vector candidate avatar portraits
│   │   ├── logo.svg
│   │   ├── default-avatar.svg
│   │   ├── candidate1.svg - candidate7.svg
│   └── symbols/                 # Official campaign symbols (SVG)
│       ├── torch.svg
│       ├── sun.svg
│       ├── star.svg
│       ├── book.svg
│       ├── shield.svg
│       ├── pen.svg
│       └── compass.svg
│
└── data/
    └── demo-data.json           # JSON template representing the relational data schema
```

---

## ⚡ 6. Detailed Feature Breakdown

### A. Admin Voter Management (Section 3, 4, 5)
* **Comprehensive Add Voter Form**: Manually enters all details across 4 structured sections:
  1. **Login Information**: User ID (unique check), Password, Confirm Password (must match).
  2. **Personal Information**: Full Name, Date of Birth, Gender, Email, Phone Number, Address.
  3. **Academic/Organization Information**: Student/Employee ID, Department, Class/Year, Section.
  4. **Account Information**: Status (Active/Inactive), Created Date.
* **Voter Table**: Displays `User ID | Name | Student/Employee ID | Department | Email | Phone | Status | Actions`.
* **Actions**: View Details Modal, Edit Voter, Delete Voter (with confirmation modal), Activate/Deactivate Toggle.
* **Instant Search & Filter**: Real-time search across Name, ID, or Email; filter by Department and Status.

### B. Candidate & Symbol Management (Section 8, 9, 10, 11)
* **Candidate Creation**: Candidate Name, Candidate ID, Post/Position, Election, Description, Department, Status.
* **Photo & Symbol Upload**:
  - File input supporting PNG, JPG, JPEG, WEBP.
  - Processed using browser `FileReader` API as Base64 DataURLs.
  - Live preview before saving.
  - Ability to upload, replace, or remove photos and symbols anytime.
  - Fallback to clean built-in SVG symbols (Torch, Sun, Star, Book, Shield, Pen, Compass).
* **Professional Candidate Cards**: Photo, symbol, name, ID, position, description, status badge, and action buttons.

### C. Posts & Election Lifecycle Control (Section 12, 13, 14)
* **Post/Position Management**: Create executive posts (e.g. President, Vice President, Secretary, Joint Secretary, Treasurer) and set display order.
* **Election Scheduling**: Configure Start Date, Start Time, End Date, End Time, and Description.
* **Lifecycle Controls**: Start and Stop election buttons to toggle status between **Upcoming**, **Active**, and **Completed**.
* **Strict Electoral Gating**: Ballots can only be cast when the election status is explicitly **Active**.

### D. Voter Voting Workflow (Section 15, 16, 17, 18, 19, 20, 21)
1. **Personalized Dashboard**: Greets voter by name, shows Department, Student ID, current election status, and "Vote Now" button.
2. **Confidential Secret Ballot**:
   - Organizes candidates cleanly under each contested post.
   - Shows candidate portrait, official symbol, candidate ID, name, and manifesto.
   - Enforces **single-candidate selection per post** via custom radio cards.
3. **Review Your Vote Dialog (Section 18)**:
   - Before submission, pops up a dedicated verification modal displaying each post and the selected candidate + symbol.
   - Displays required warning: *"Please verify your selections carefully. Once your vote is submitted, it cannot be changed."*
   - Buttons: **Edit Selection** (returns to ballot) and **Confirm and Submit** (records vote).
4. **Duplicate Vote Prevention (Section 19 & 20)**:
   - Atomic verification against stored vote records.
   - If an account has already voted, blocks voting and displays: *"You have already voted in this election."*
   - Disables submit button and shows link to receipt.
5. **Vote Submitted Successfully Confirmation (Section 21)**:
   - Generates unique confirmation number (e.g. `VOTE-2026-B81C4F`).
   - Displays Election Name, Voter Name, User ID, and Timestamp.
   - Includes **Print Receipt** button for voter personal records.

### E. Dynamic Results & Analytics (Section 22, 23)
* **Dynamically Calculated**: Zero hardcoded vote counts. Every tally is computed on-the-fly from the stored ballots array.
* **Post-Wise Results**: Shows Candidate, Symbol, Total Votes, Percentage Share, and pure CSS animated progress bars.
* **Winner Highlights**: Automatically attaches a gold `★ Leading / Winner` badge to the top candidate.
* **Access Policy Control**: Admin can toggle whether results are public to voters or restricted to administrators only.

### F. Reports & CSV Exports (Section 36)
Generate and export 6 complete report types:
1. **Election Report**: Comprehensive election metrics, status, duration, and department-wise turnout breakdown.
2. **Voter List Report**: Complete roster of all registered voters, academic details, and ballot submission status.
3. **Candidate List Report**: Approved candidate directory, contested posts, and electoral symbols.
4. **Voting Participation Report**: Turnout audit showing eligible voters, ballots cast, yet-to-vote count, and confirmation codes.
5. **Post-Wise Results**: Certified standings and percentages for each post.
6. **Candidate Results**: Detailed candidate rankings, vote counts, and victory margins.
* **One-Click Export**: Converts active report to standard `.csv` file via vanilla JavaScript `Blob` download.
* **Print Report**: Custom `@media print` stylesheet for clean paper and PDF printing.

### G. Settings & Prototype Reset (Section 25, 44)
* **Admin Profile**: Edit administrator display name and official email.
* **Change Admin Password**: Validate old password and set a new password.
* **System Policy**: Toggle public results visibility.
* **Reset Demo Data**: One-click restore button with confirmation modal to reset all voters, candidates, elections, and ballots back to clean demo state.

---

## 🚀 7. How to Run the Application

Because VoteSecure is built exclusively with standard HTML5, CSS3, and JavaScript, **no npm install, compilation, or server setup is required**.

### Option A: VS Code Live Server (Recommended)
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click on `index.html` and click **"Open with Live Server"**.
4. The system opens at `http://127.0.0.1:5500/index.html`.

### Option B: Python Local Server
If you have Python installed, open terminal/PowerShell in the project folder:
```bash
# Python 3
python -m http.server 8000
```
Open `http://localhost:8000/index.html` in your browser.

### Option C: Direct Browser Opening
Simply double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari.

---

## 🎓 8. College Project Presentation & Viva Preparation Guide

Here are concise, high-scoring answers to common viva and evaluation questions:

### Q1: Why did you use LocalStorage instead of a backend database like MySQL or MongoDB?
> **Answer**: VoteSecure was specifically designed to demonstrate deep mastery of core frontend web technologies (HTML5 semantic markup, CSS3 layout and animations, vanilla ES6+ JavaScript, and DOM manipulation) without the complexity of external backend runtimes. Browser LocalStorage provides client-side key-value persistence that persists across page refreshes and browser restarts, simulating database persistence for demonstration and educational purposes.

### Q2: Why is there no "Register / Sign Up" button on the voter login page?
> **Answer**: In official democratic institutional elections (such as collegiate student councils, bar councils, or national elections), voters cannot self-register arbitrarily. The election commission or administration must verify institutional eligibility (enrollment, department, attendance, disciplinary standing) before issuing credentials. To prevent fake registrations, the administrator manually creates all voter accounts and directly issues the User ID and Password.

### Q3: How do you prevent duplicate voting?
> **Answer**: Duplicate vote prevention is enforced at multiple layers:
> 1. In `Storage.hasVoted(voterId, electionId)`, the system checks the `votes` array in LocalStorage for any existing record containing matching `voterId` and `electionId`.
> 2. When the voter accesses the ballot (`voting.html`), the script immediately checks this condition. If true, the voting form is replaced with a warning banner: *"You have already voted in this election"* and displays their confirmation receipt.
> 3. Even during form submission (`recordVote`), an atomic re-check runs before saving the ballot.

### Q4: How is ballot confidentiality maintained during voting?
> **Answer**: Individual ballot records store the election ID, voter ID (to verify turnout), and a generated unique confirmation token (e.g. `VOTE-2026-XXXXXX`). In the public results and reports, candidate vote counts are aggregated without displaying individual voter selections alongside voter personal identities.

### Q5: How do candidate photo and symbol uploads work without a backend server?
> **Answer**: We utilize the HTML5 `FileReader` API. When an administrator selects an image file (PNG, JPG, WEBP), `FileReader.readAsDataURL()` converts the binary file into a Base64-encoded Data URL string. This string is stored directly in the candidate object in LocalStorage and rendered via `<img src="data:image/...">` elements with zero server dependencies.

### Q6: How are results calculated? Are they hardcoded?
> **Answer**: Results are 100% dynamic. The `results.js` script queries the `votes` array for the selected election, iterates over all posts and candidates, and tallies the count for each candidate (`tally[candidateId]++`). Percentage share is computed using `(votes / totalPostVotes) * 100`. The progress bars and winner badges are then updated in the DOM in real time.

### Q7: How does CSV Export work without external libraries?
> **Answer**: `Utils.exportToCSV()` constructs a comma-separated text string, properly escaping commas and quotes (`"..."`). It then instantiates a browser `Blob` object with MIME type `text/csv;charset=utf-8;`, creates a temporary object URL via `URL.createObjectURL(blob)`, assigns it to a virtual anchor element with the `download` attribute, and programmatically clicks it to trigger the browser's native download manager.

---

## 🛡️ 9. Educational Security & Architecture Disclaimer

> [!CAUTION]
> **Educational Prototype Notice**: VoteSecure is an educational demonstration project. Browser LocalStorage and client-side JavaScript authentication are used to illustrate application workflows in a lightweight, self-contained environment.
>
> In a **production or commercial voting environment**, the following server-side security measures are mandatory:
> 1. **Server-Side Authentication**: Password hashing using bcrypt or Argon2, multi-factor authentication (MFA/OTP), and cryptographically signed session tokens (JWT/HttpOnly cookies).
> 2. **Relational Database Security**: SQL database (e.g. PostgreSQL) with ACID transactions, row-level security, and foreign key constraints.
> 3. **Cryptographic End-to-End Verifiability (E2E-V)**: Homomorphic encryption (e.g., Paillier or ElGamal cryptosystems) and zero-knowledge proofs (ZKP) to ensure mathematical proof of accurate counting while making it impossible to link a voter to their ballot choices.
> 4. **Hardware Security Modules (HSM)** and independent third-party audit trails.

---

## 🔄 10. Git Version Control Workflow

To initialize and publish this repository to GitHub:

```bash
# 1. Open terminal in the project directory
cd online-voting-system

# 2. Initialize git repository
git init

# 3. Stage all files
git add .

# 4. Commit with descriptive message
git commit -m "feat: complete VoteSecure online voting system with zero self-registration and reports"

# 5. Rename default branch to main
git branch -M main

# 6. Add remote repository URL
git remote add origin https://github.com/YOUR_USERNAME/online-voting-system.git

# 7. Push to GitHub
git push -u origin main
```

---

## 📄 11. License

Developed for educational purposes, university coursework, and lab viva examinations. Free to inspect, adapt, and demonstrate.

&copy; 2026 **VoteSecure — Online Voting System**. Built with HTML5, CSS3, and Vanilla JavaScript.
