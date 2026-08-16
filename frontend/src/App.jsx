import { useState } from "react";
import "./App.css";

function getAge(dateOfBirth) {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const hasNotHadBirthdayYet =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (hasNotHadBirthdayYet) {
    age -= 1;
  }

  return age;
}

function App() {
  const [profileUrl, setProfileUrl] = useState("");
  const [libraryPreview, setLibraryPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [weeklyGamingHours, setWeeklyGamingHours] = useState("8");
  const [keepGamingAfterRetirement, setKeepGamingAfterRetirement] =
    useState(true);

  const age = dateOfBirth ? getAge(dateOfBirth) : null;
  const gamingHorizon = keepGamingAfterRetirement ? 82 : 65;

  const remainingYears = age === null ? null : Math.max(gamingHorizon - age, 0);

  const remainingGamingHours =
    remainingYears === null
      ? null
      : Math.round(remainingYears * 52 * Number(weeklyGamingHours));

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
          <>
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

            <section className="calculator-card">
              <p className="preview-label">YOUR GAMING PACE</p>
              <h2>Can your current pace clear the backlog?</h2>

              <p className="calculator-intro">
                Just two simple inputs for now. We will compare this gaming
                budget with your estimated backlog hours next.
              </p>

              <div className="simple-calculator">
                <label>
                  Date of birth
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                  />
                </label>

                <div>
                  <p className="pace-label">Typical gaming time</p>

                  <div className="pace-value">
                    {weeklyGamingHours} <span>hours per week</span>
                  </div>

                  <input
                    className="pace-slider"
                    type="range"
                    min="1"
                    max="40"
                    value={weeklyGamingHours}
                    onChange={(event) =>
                      setWeeklyGamingHours(event.target.value)
                    }
                  />

                  <div className="pace-options">
                    <button
                      type="button"
                      onClick={() => setWeeklyGamingHours("4")}
                    >
                      Casual · 4h
                    </button>

                    <button
                      type="button"
                      onClick={() => setWeeklyGamingHours("8")}
                    >
                      Regular · 8h
                    </button>

                    <button
                      type="button"
                      onClick={() => setWeeklyGamingHours("15")}
                    >
                      Dedicated · 15h
                    </button>
                  </div>
                </div>

                <label className="retirement-toggle">
                  <input
                    type="checkbox"
                    checked={keepGamingAfterRetirement}
                    onChange={(event) =>
                      setKeepGamingAfterRetirement(event.target.checked)
                    }
                  />

                  <span>
                    <strong>Retirement mode</strong>
                    <small>
                      {keepGamingAfterRetirement
                        ? "Include gaming until age 82"
                        : "Stop the forecast at age 65"}
                    </small>
                  </span>
                </label>
              </div>

              {remainingGamingHours !== null && (
                <div className="future-result">
                  <p>Your lifetime gaming budget</p>
                  <strong>{remainingGamingHours.toLocaleString()} hours</strong>
                  <span>
                    At your current pace of {weeklyGamingHours} hours a week,
                    until age {gamingHorizon}.
                  </span>
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default App;
