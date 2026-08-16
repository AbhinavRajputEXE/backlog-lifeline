import { useState } from "react";
import "./App.css";

function App() {
  const [profileUrl, setProfileUrl] = useState("");
  const [libraryPreview, setLibraryPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setErrorMessage("");
    setLibraryPreview(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/library-preview",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile_url: profileUrl,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong.");
      }

      setLibraryPreview(data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">STEAM BACKLOG REALITY CHECK</p>

        <h1>Will you finish your games in this lifetime?</h1>

        <p className="intro">
          Connect your public Steam profile and find out what your game library
          is really asking of you.
        </p>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label htmlFor="profile-url">Your public Steam profile URL</label>

          <div className="input-row">
            <input
              id="profile-url"
              type="url"
              value={profileUrl}
              onChange={(event) => setProfileUrl(event.target.value)}
              placeholder="https://steamcommunity.com/id/your-name"
              required
            />

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Importing…" : "Analyse backlog"}
            </button>
          </div>

          <p className="privacy-note">
            Your Steam profile and Game Details must be public. We will never
            ask for your Steam password.
          </p>
        </form>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {libraryPreview && (
          <section className="preview-card">
            <p className="preview-label">LIVE STEAM LIBRARY</p>
            <h2>Your backlog begins here.</h2>

            <p className="steam-id">Steam ID: {libraryPreview.steam_id}</p>

            <div className="stats">
              <div>
                <strong>{libraryPreview.game_count}</strong>
                <span>games owned</span>
              </div>

              <div>
                <strong>
                  {libraryPreview.total_playtime_hours.toLocaleString()}
                </strong>
                <span>hours already played</span>
              </div>
            </div>

            <h3>Most played games</h3>

            <ul className="game-list">
              {libraryPreview.most_played_games.map((game) => (
                <li key={game.name}>
                  <span>{game.name}</span>
                  <strong>{game.playtime_hours}h</strong>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
