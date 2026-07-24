import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [apiStatus, setApiStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkBackendConnection() {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/health");

        if (!response.ok) {
          throw new Error("The backend returned an error.");
        }

        const data = await response.json();
        setApiStatus(data);
      } catch {
        setErrorMessage(
          "Could not reach the backend. Check that the Python server is running.",
        );
      }
    }

    checkBackendConnection();
  }, []);

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">STEAM BACKLOG REALITY CHECK</p>

        <h1>Will you finish your games in this lifetime?</h1>

        <p className="intro">
          Connect your Steam library, estimate your available gaming time, and
          find out whether your backlog is realistic.
        </p>

        <div className="connection-card">
          <span className="status-dot" />

          <div>
            <p className="connection-label">Backend connection</p>

            {apiStatus ? (
              <p className="connection-message">{apiStatus.message}</p>
            ) : errorMessage ? (
              <p className="connection-error">{errorMessage}</p>
            ) : (
              <p className="connection-message">Checking connection…</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;