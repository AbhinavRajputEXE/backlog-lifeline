from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Backlog Lifeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProfileRequest(BaseModel):
    profile_url: str


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Backlog Lifeline backend is connected.",
    }


@app.post("/api/library-preview")
def create_library_preview(profile: ProfileRequest):
    profile_url = profile.profile_url.strip()

    if not profile_url:
        raise HTTPException(
            status_code=400,
            detail="Please enter a Steam profile URL.",
        )

    return {
        "profile_name": "Demo Gamer",
        "game_count": 127,
        "total_playtime_hours": 2460,
        "profile_url": profile_url,
    }
