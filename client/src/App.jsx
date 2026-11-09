
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Users, Ticket, Clock, CheckCircle, ArrowRight,
  Building2, Monitor, Trash2, RefreshCw
} from "lucide-react";
import "./App.css";

const API = "https://queueless-2iir.onrender.com/api/tokens";

const departments = [
  "Accounts Office",
  "Faculty Office",
  "Library",
  "Computer Laboratory",
  "Administration Office"
];

function App() {
  const [department, setDepartment] = useState(departments[0]);
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [tokens, setTokens] = useState([]);
  const [message, setMessage] = useState("");

  // Convert MongoDB token data into frontend format
  const formatToken = (token) => ({
    id: token._id,
    number: token.tokenNumber,
    name: token.name,
    uid: token.uid,
    department: token.department,
    status: token.status.charAt(0).toUpperCase() + token.status.slice(1)
  });

  // Fetch tokens from MongoDB
  const fetchTokens = useCallback(async () => {
    try {
      const response = await axios.get(API);

      if (response.data.success) {
        setTokens(response.data.tokens.map(formatToken));
      }
    } catch (error) {
      console.error("Error fetching tokens:", error.message);
    }
  }, []);

  // Load tokens and refresh every 3 seconds
  useEffect(() => {
    fetchTokens();

    const interval = setInterval(fetchTokens, 3000);

    return () => clearInterval(interval);
  }, [fetchTokens]);

  const waitingTokens = tokens.filter(
    token =>
      token.status === "Waiting" &&
      token.department === department
  );

  const completedTokens = tokens.filter(
    token =>
      token.status === "Completed" &&
      token.department === department
  );

  const currentNumber = tokens
    .filter(
      token =>
        token.department === department &&
        token.status === "Serving"
    )
    .map(token => token.number)[0] || 0;

  // Generate token and save it in MongoDB
  const generateToken = async (e) => {
    e.preventDefault();

    if (!name.trim() || !uid.trim()) {
      setMessage("Please enter your name and UID.");
      return;
    }

    try {
      const response = await axios.post(`${API}/generate`, {
        name: name.trim(),
        uid: uid.trim(),
        department
      });

      await fetchTokens();

      const number = response.data.token.tokenNumber;

      setMessage(`Your token Q${number} has been generated!`);
      setName("");
      setUid("");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to generate token."
      );
    }
  };

  // Call the next student
  const callNext = async () => {
    if (waitingTokens.length === 0) {
      setMessage("No students are waiting in this department.");
      return;
    }

    try {
      const currentToken = tokens.find(
        token =>
          token.department === department &&
          token.status === "Serving"
      );

      if (currentToken) {
        await axios.patch(`${API}/${currentToken.id}/status`, {
          status: "completed"
        });
      }

      const next = waitingTokens[0];

      await axios.patch(`${API}/${next.id}/status`, {
        status: "serving"
      });

      await fetchTokens();

      setMessage(`Now serving token Q${next.number}.`);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to call next student."
      );
    }
  };

  // Complete the currently serving token
  const completeCurrent = async () => {
    const currentToken = tokens.find(
      token =>
        token.department === department &&
        token.status === "Serving"
    );

    if (!currentToken) {
      setMessage("No token is currently being served.");
      return;
    }

    try {
      await axios.patch(`${API}/${currentToken.id}/status`, {
        status: "completed"
      });

      await fetchTokens();
      setMessage("Current token marked as completed.");
    } catch (error) {
      setMessage("Unable to complete token.");
    }
  };

  // Cancel a token
  const cancelToken = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      await fetchTokens();
      setMessage("Token cancelled successfully.");
    } catch (error) {
      setMessage("Unable to cancel token.");
    }
  };

  // Reset the selected department's queue
  const resetQueue = async () => {
    const departmentTokens = tokens.filter(
      token => token.department === department
    );

    if (departmentTokens.length === 0) {
      setMessage("This department's queue is already empty.");
      return;
    }

    try {
      await Promise.all(
        departmentTokens.map(token =>
          axios.delete(`${API}/${token.id}`)
        )
      );

      await fetchTokens();
      setMessage("This department's queue has been reset.");
    } catch (error) {
      await fetchTokens();
      setMessage("Unable to reset the complete queue.");
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><Ticket size={23} /></div>
          <div>
            <h2>QueueLess</h2>
            <span>Smart Campus Queue System</span>
          </div>
        </div>

        <div className="live-status">
          <span className="live-dot"></span> System Online
        </div>
      </header>

      <main className="main-content">
        <section className="welcome">
          <div>
            <p className="eyebrow">CAMPUS SERVICE PORTAL</p>
            <h1>Skip the line.<br /><span>Save your time.</span></h1>
            <p className="welcome-text">
              Generate your digital token and track your queue in real time.
            </p>
          </div>

          <div className="welcome-icon"><Building2 size={76} /></div>
        </section>

        {message && (
          <div className="message">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon purple"><Users /></div>
            <div>
              <span>People Waiting</span>
              <h2>{waitingTokens.length}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue"><Monitor /></div>
            <div>
              <span>Now Serving</span>
              <h2>{currentNumber ? `Q${currentNumber}` : "--"}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle /></div>
            <div>
              <span>Completed</span>
              <h2>{completedTokens.length}</h2>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel token-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">STUDENT PORTAL</p>
                <h2>Get Your Token</h2>
              </div>
              <div className="heading-icon"><Ticket /></div>
            </div>

            <form onSubmit={generateToken}>
              <label>Select Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                {departments.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <label>Student Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
              />

              <label>University UID</label>
              <input
                type="text"
                placeholder="Enter your UID"
                value={uid}
                onChange={e => setUid(e.target.value)}
              />

              <button className="primary-button" type="submit">
                Generate Token <ArrowRight size={18} />
              </button>
            </form>
          </div>

          <div className="panel display-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">LIVE QUEUE DISPLAY</p>
                <h2>Current Status</h2>
              </div>
              <div className="heading-icon"><Clock /></div>
            </div>

            <div className="serving-box">
              <span>NOW SERVING</span>
              <h1>{currentNumber ? `Q${currentNumber}` : "--"}</h1>
              <p>{department}</p>
            </div>

            <div className="queue-details">
              <div>
                <span>Next Token</span>
                <strong>
                  {waitingTokens[0] ? `Q${waitingTokens[0].number}` : "--"}
                </strong>
              </div>

              <div>
                <span>Waiting</span>
                <strong>{waitingTokens.length} students</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="panel queue-panel">
          <div className="panel-heading queue-heading">
            <div>
              <p className="eyebrow">QUEUE MANAGEMENT</p>
              <h2>Waiting Students</h2>
            </div>
            <span className="count-pill">{waitingTokens.length} in queue</span>
          </div>

          {waitingTokens.length === 0 ? (
            <div className="empty-state">
              <Users size={34} />
              <p>No students are waiting right now.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Student Name</th>
                    <th>UID</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {waitingTokens.map(token => (
                    <tr key={token.id}>
                      <td><strong>Q{token.number}</strong></td>
                      <td>{token.name}</td>
                      <td>{token.uid}</td>
                      <td><span className="status waiting">Waiting</span></td>
                      <td>
                        <button
                          className="delete-button"
                          onClick={() => cancelToken(token.id)}
                        >
                          <Trash2 size={16} /> Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ADMINISTRATION</p>
              <h2>Admin Controls</h2>
            </div>
            <div className="heading-icon"><Monitor /></div>
          </div>

          <p className="admin-description">
            Manage the selected department's queue and serve students in order.
          </p>

          <div className="admin-buttons">
            <button className="primary-button" onClick={callNext}>
              Call Next Student <ArrowRight size={18} />
            </button>

            <button className="secondary-button" onClick={completeCurrent}>
              <CheckCircle size={18} /> Mark Completed
            </button>

            <button className="secondary-button reset-button" onClick={resetQueue}>
              <RefreshCw size={18} /> Reset Queue
            </button>
          </div>
        </section>

        <footer>
          <strong>QueueLess</strong> — Making campus services faster and smarter.
        </footer>
      </main>
    </div>
  );
}

export default App;
