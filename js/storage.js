/**
 * VoteSecure - Centralized Storage Management
 * Handles all browser LocalStorage operations for the educational prototype.
 * 
 * NOTE: For this educational prototype, LocalStorage is used to simulate persistence.
 * In a real production system, secure backend databases and APIs must be used.
 */

// Prefix to prevent collisions in localStorage
const STORAGE_PREFIX = 'votesecure_';

// Storage Keys
const STORAGE_KEYS = {
  ADMIN: STORAGE_PREFIX + 'admin',
  VOTERS: STORAGE_PREFIX + 'voters',
  CANDIDATES: STORAGE_PREFIX + 'candidates',
  ELECTIONS: STORAGE_PREFIX + 'elections',
  POSTS: STORAGE_PREFIX + 'posts',
  VOTES: STORAGE_PREFIX + 'votes',
  CURRENT_USER: STORAGE_PREFIX + 'currentUser',
  CURRENT_ELECTION: STORAGE_PREFIX + 'currentElection',
  LOGS: STORAGE_PREFIX + 'logs',
  SETTINGS: STORAGE_PREFIX + 'settings'
};

// Default initial dataset (mirrors data/demo-data.json)
// Embedded directly so the project functions seamlessly over file:// or http:// protocols
const INITIAL_DEMO_DATA = {
  admin: {
    username: "admin",
    password: "Admin@123",
    name: "System Administrator",
    email: "admin@votesecure.edu",
    role: "admin"
  },
  voters: [
    {
      id: "VOTER001",
      userId: "VOTER001",
      password: "voter123",
      fullName: "Rahul Kumar",
      name: "Rahul Kumar",
      dateOfBirth: "2005-05-15",
      gender: "Male",
      email: "rahul@example.com",
      phone: "9876543210",
      address: "Room 304, Boys Hostel Block A, University Campus",
      studentId: "STU2026001",
      department: "Computer Science",
      year: "3rd Year",
      section: "A",
      status: "Active",
      createdAt: "2026-09-20T10:00:00.000Z"
    },
    {
      id: "VOTER002",
      userId: "VOTER002",
      password: "voter456",
      fullName: "Priya Sharma",
      name: "Priya Sharma",
      dateOfBirth: "2005-08-22",
      gender: "Female",
      email: "priya.sharma@example.com",
      phone: "9876543211",
      address: "Flat 12B, Emerald Towers, Tech Park Road",
      studentId: "STU2026002",
      department: "Information Technology",
      year: "3rd Year",
      section: "B",
      status: "Active",
      createdAt: "2026-09-21T11:00:00.000Z"
    },
    {
      id: "VOTER003",
      userId: "VOTER003",
      password: "voter789",
      fullName: "Arjun Rao",
      name: "Arjun Rao",
      dateOfBirth: "2004-11-10",
      gender: "Male",
      email: "arjun.rao@example.com",
      phone: "9876543212",
      address: "45 Lakeview Avenue, Green Park",
      studentId: "STU2026003",
      department: "Electronics & Communication",
      year: "4th Year",
      section: "A",
      status: "Active",
      createdAt: "2026-09-22T09:30:00.000Z"
    },
    {
      id: "VOTER004",
      userId: "VOTER004",
      password: "voter101",
      fullName: "Sneha Patel",
      name: "Sneha Patel",
      dateOfBirth: "2005-02-18",
      gender: "Female",
      email: "sneha.patel@example.com",
      phone: "9876543213",
      address: "Room 102, Girls Hostel Block C",
      studentId: "STU2026004",
      department: "Computer Science",
      year: "3rd Year",
      section: "B",
      status: "Active",
      createdAt: "2026-09-23T14:15:00.000Z"
    },
    {
      id: "VOTER005",
      userId: "VOTER005",
      password: "voter202",
      fullName: "Karthik Verma",
      name: "Karthik Verma",
      dateOfBirth: "2004-07-09",
      gender: "Male",
      email: "karthik.v@example.com",
      phone: "9876543214",
      address: "88 North Extension, Near Central Station",
      studentId: "STU2026005",
      department: "Mechanical Engineering",
      year: "4th Year",
      section: "A",
      status: "Inactive",
      createdAt: "2026-09-24T16:00:00.000Z"
    }
  ],
  elections: [
    {
      id: "ELECTION001",
      name: "College Student Council Election 2026",
      title: "College Student Council Election 2026",
      description: "Annual university-wide election for student government executive leadership positions for the academic year 2026-2027.",
      startDate: "2026-10-01",
      startTime: "09:00",
      endDate: "2026-10-15",
      endTime: "17:00",
      status: "Active",
      createdAt: "2026-09-28T08:00:00.000Z"
    },
    {
      id: "ELECTION002",
      name: "Engineering Department Representative Election 2026",
      title: "Engineering Department Representative Election 2026",
      description: "Electing academic faculty and departmental representatives to the university student senate board.",
      startDate: "2026-11-01",
      startTime: "10:00",
      endDate: "2026-11-10",
      endTime: "16:00",
      status: "Upcoming",
      createdAt: "2026-09-30T10:00:00.000Z"
    }
  ],
  posts: [
    {
      id: "POST001",
      name: "President",
      electionId: "ELECTION001",
      order: 1,
      description: "Leads the Student Council, represents the student body before university administration, and presides over executive meetings."
    },
    {
      id: "POST002",
      name: "Vice President",
      electionId: "ELECTION001",
      order: 2,
      description: "Assists the President, coordinates council committees, and manages campus student organizations."
    },
    {
      id: "POST003",
      name: "Secretary",
      electionId: "ELECTION001",
      order: 3,
      description: "Maintains council records, issues official communications, and records meeting minutes."
    },
    {
      id: "POST004",
      name: "Joint Secretary",
      electionId: "ELECTION001",
      order: 4,
      description: "Coordinates academic club operations and inter-departmental communications."
    },
    {
      id: "POST005",
      name: "Treasurer",
      electionId: "ELECTION001",
      order: 5,
      description: "Oversees student council budgeting, activity grants, and annual financial allocations."
    }
  ],
  candidates: [
    {
      id: "CAND001",
      name: "Rahul Kumar",
      postId: "POST001",
      electionId: "ELECTION001",
      symbol: "torch",
      symbolName: "Torch of Progress",
      symbolPath: "assets/symbols/torch.svg",
      photo: "assets/images/candidate-1.svg",
      description: "Third-year Computer Science student. Advocating for 24/7 library hours, campus mental health support, and transparent student council budgets.",
      department: "Computer Science",
      status: "Active"
    },
    {
      id: "CAND002",
      name: "Sarah Jenkins",
      postId: "POST001",
      electionId: "ELECTION001",
      symbol: "sun",
      symbolName: "Rising Sun",
      symbolPath: "assets/symbols/sun.svg",
      photo: "assets/images/candidate-2.svg",
      description: "Championing affordable campus meal plans, enhanced sports facilities, and expanded campus shuttle routes.",
      department: "Information Technology",
      status: "Active"
    },
    {
      id: "CAND003",
      name: "Michael Chang",
      postId: "POST001",
      electionId: "ELECTION001",
      symbol: "book",
      symbolName: "Open Book",
      symbolPath: "assets/symbols/book.svg",
      photo: "assets/images/candidate-3.svg",
      description: "Focused on competitive research grants, tech symposium funding, and paid student internship pipelines.",
      department: "Computer Science",
      status: "Active"
    },
    {
      id: "CAND004",
      name: "Priya Sharma",
      postId: "POST002",
      electionId: "ELECTION001",
      symbol: "star",
      symbolName: "Guiding Star",
      symbolPath: "assets/symbols/star.svg",
      photo: "assets/images/candidate-4.svg",
      description: "Committed to diverse cultural fests, inclusive student representation, and peer-to-peer mentoring programs.",
      department: "Information Technology",
      status: "Active"
    },
    {
      id: "CAND005",
      name: "Kevin Patel",
      postId: "POST002",
      electionId: "ELECTION001",
      symbol: "shield",
      symbolName: "Shield of Integrity",
      symbolPath: "assets/symbols/shield.svg",
      photo: "assets/images/candidate-5.svg",
      description: "Focusing on campus lighting, night safety escorts, green sustainability, and zero single-use plastic initiatives.",
      department: "Mechanical Engineering",
      status: "Active"
    },
    {
      id: "CAND006",
      name: "Arjun Rao",
      postId: "POST003",
      electionId: "ELECTION001",
      symbol: "pen",
      symbolName: "Quill of Governance",
      symbolPath: "assets/symbols/pen.svg",
      photo: "assets/images/candidate-6.svg",
      description: "Ensuring open-access council minutes, digital student grievance portal, and monthly town hall Q&A sessions.",
      department: "Electronics & Communication",
      status: "Active"
    },
    {
      id: "CAND007",
      name: "Emily Davis",
      postId: "POST003",
      electionId: "ELECTION001",
      symbol: "compass",
      symbolName: "Compass of Direction",
      symbolPath: "assets/symbols/compass.svg",
      photo: "assets/images/candidate-7.svg",
      description: "Modernizing student club registrations, automated event calendars, and career development workshops.",
      department: "Computer Science",
      status: "Active"
    }
  ],
  votes: [],
  settings: {
    allowPublicResults: true,
    systemTitle: "VoteSecure Online Voting System"
  },
  logs: [
    {
      id: "LOG001",
      timestamp: "2026-10-01T08:00:00.000Z",
      action: "Election Initialized",
      detail: "College Student Council Election 2026 set to Active status.",
      user: "admin"
    },
    {
      id: "LOG002",
      timestamp: "2026-10-01T08:30:00.000Z",
      action: "Candidates Registered",
      detail: "7 candidates registered across President, Vice President, and Secretary posts.",
      user: "admin"
    }
  ]
};

const Storage = {
  /**
   * Initialize LocalStorage with demo data if not already present.
   * Demo data should be inserted only when no existing data is found.
   */
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN)) {
      this.resetDemoData();
    }
  },

  /**
   * Save raw data under a specific key
   */
  saveData(key, data) {
    try {
      const storageKey = STORAGE_KEYS[key.toUpperCase()] || (STORAGE_PREFIX + key);
      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Retrieve parsed data for a specific key
   */
  getData(key, fallback = null) {
    try {
      const storageKey = STORAGE_KEYS[key.toUpperCase()] || (STORAGE_PREFIX + key);
      const data = localStorage.getItem(storageKey);
      if (!data) return fallback;
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading data for key ${key}:`, error);
      return fallback;
    }
  },

  /**
   * Update an existing object inside an array key by ID
   */
  updateData(key, id, updatedFields) {
    const list = this.getData(key, []);
    if (!Array.isArray(list)) return false;
    
    const index = list.findIndex(item => item.id === id);
    if (index === -1) return false;

    list[index] = { ...list[index], ...updatedFields };
    return this.saveData(key, list);
  },

  /**
   * Delete an item by ID from an array key
   */
  deleteData(key, id) {
    const list = this.getData(key, []);
    if (!Array.isArray(list)) return false;

    const filtered = list.filter(item => item.id !== id);
    return this.saveData(key, filtered);
  },

  /**
   * Append a new item to an array key
   */
  appendData(key, newItem) {
    const list = this.getData(key, []);
    if (!Array.isArray(list)) return false;

    list.push(newItem);
    return this.saveData(key, list);
  },

  /**
   * Clear a specific key
   */
  clearData(key) {
    const storageKey = STORAGE_KEYS[key.toUpperCase()] || (STORAGE_PREFIX + key);
    localStorage.removeItem(storageKey);
  },

  /**
   * Reset all demo data to default clean state
   */
  resetDemoData() {
    this.saveData('admin', INITIAL_DEMO_DATA.admin);
    this.saveData('voters', INITIAL_DEMO_DATA.voters);
    this.saveData('elections', INITIAL_DEMO_DATA.elections);
    this.saveData('posts', INITIAL_DEMO_DATA.posts);
    this.saveData('candidates', INITIAL_DEMO_DATA.candidates);
    this.saveData('votes', INITIAL_DEMO_DATA.votes);
    this.saveData('settings', INITIAL_DEMO_DATA.settings);
    this.saveData('logs', INITIAL_DEMO_DATA.logs);
    this.saveData('currentElection', 'ELECTION001');
    console.log('VoteSecure demo data initialized/reset successfully.');
  },

  /**
   * Audit log helper
   */
  addLog(action, detail, user = 'system') {
    const logs = this.getData('logs', []);
    const newLog = {
      id: 'LOG' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      action,
      detail,
      user
    };
    logs.unshift(newLog);
    // Keep last 50 logs
    if (logs.length > 50) logs.pop();
    this.saveData('logs', logs);
  },

  /**
   * Check if a voter has already cast a ballot for a given election
   */
  hasVoted(voterId, electionId) {
    const votes = this.getData('votes', []);
    return votes.some(vote => (vote.voterId === voterId || vote.userId === voterId) && vote.electionId === electionId);
  },

  /**
   * Record a verified vote and return confirmation details
   */
  recordVote({ electionId, voterId, selections }) {
    if (this.hasVoted(voterId, electionId)) {
      return { success: false, message: 'Duplicate vote detected. You have already voted in this election.' };
    }

    // Generate unique verification code (e.g. VOTE-2026-A82F91)
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const confirmationId = `VOTE-2026-${randomHex}`;
    const timestamp = new Date().toISOString();

    const voteRecord = {
      id: confirmationId,
      confirmationNumber: confirmationId,
      electionId,
      voterId,
      userId: voterId,
      voted: true,
      timestamp,
      votedAt: timestamp,
      selections
    };

    const votes = this.getData('votes', []);
    votes.push(voteRecord);
    this.saveData('votes', votes);

    // Audit logging
    this.addLog('Vote Cast', `Voter ${voterId} cast ballot. Confirmation: ${confirmationId}`, voterId);

    return {
      success: true,
      confirmationId,
      confirmationNumber: confirmationId,
      timestamp,
      electionId,
      voterId,
      selections
    };
  },

  /**
   * Retrieve settings with fallback
   */
  getSettings() {
    return this.getData('settings', INITIAL_DEMO_DATA.settings);
  },

  /**
   * Check if public results are visible to voters
   */
  isPublicResultsAllowed() {
    const settings = this.getSettings();
    return settings && settings.allowPublicResults === true;
  }
};

// Auto-initialize on script load
Storage.init();
