import os
from pathlib import Path
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(Path(__file__).with_name(".env"))

app = FastAPI(title="Backlog Lifeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProfileRequest(BaseModel):
    profile_url: str


def get_steam_api_key():
    steam_api_key = os.getenv("STEAM_API_KEY")

    if not steam_api_key:
        raise HTTPException(
            status_code=500,
            detail="The Steam API key has not been configured.",
        )

    return steam_api_key


def get_steam_profile_identifier(profile_url):
    parsed_url = urlparse(profile_url.strip())
    hostname = parsed_url.hostname or ""
    path_parts = [part for part in parsed_url.path.split("/") if part]

    if hostname not in {"steamcommunity.com", "www.steamcommunity.com"}:
        raise HTTPException(
            status_code=400,
            detail="Please enter a Steam Community profile URL.",
        )

    if len(path_parts) < 2:
        raise HTTPException(
            status_code=400,
            detail="That Steam profile URL is incomplete.",
        )

    profile_type = path_parts[0]
    identifier = path_parts[1]

    if profile_type == "profiles" and identifier.isdigit():
        return "steam_id", identifier

    if profile_type == "id":
        return "vanity_name", identifier

    raise HTTPException(
        status_code=400,
        detail="Use a Steam profile URL containing /id/ or /profiles/.",
    )


async def resolve_steam_id(profile_url, steam_api_key):
    identifier_type, identifier = get_steam_profile_identifier(profile_url)

    if identifier_type == "steam_id":
        return identifier

    steam_url = "https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/"

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            steam_url,
            params={
                "key": steam_api_key,
                "vanityurl": identifier,
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Steam could not resolve this profile right now.",
        )

    steam_data = response.json().get("response", {})

    if steam_data.get("success") != 1:
        raise HTTPException(
            status_code=404,
            detail="Steam could not find that profile.",
        )

    return steam_data["steamid"]


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "Backlog Lifeline backend is connected.",
    }


@app.post("/api/resolve-profile")
async def resolve_profile(profile: ProfileRequest):
    steam_api_key = get_steam_api_key()
    steam_id = await resolve_steam_id(profile.profile_url, steam_api_key)

    return {
        "steam_id": steam_id,
    }


@app.post("/api/library-preview")
async def create_library_preview(profile: ProfileRequest):
    steam_api_key = get_steam_api_key()
    steam_id = await resolve_steam_id(profile.profile_url, steam_api_key)

    steam_url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/"

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            steam_url,
            params={
                "key": steam_api_key,
                "steamid": steam_id,
                "include_appinfo": "true",
                "include_played_free_games": "true",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Steam could not load this game library right now.",
        )

    library_data = response.json().get("response", {})
    games = library_data.get("games")

    if games is None:
        raise HTTPException(
            status_code=403,
            detail=(
                "Steam could not access this library. "
                "Make sure the profile and Game Details are public."
            ),
        )

    total_playtime_minutes = sum(game.get("playtime_forever", 0) for game in games)

    most_played_games = sorted(
        games,
        key=lambda game: game.get("playtime_forever", 0),
        reverse=True,
    )[:5]

    return {
        "steam_id": steam_id,
        "game_count": library_data.get("game_count", len(games)),
        "total_playtime_hours": round(total_playtime_minutes / 60),
        "most_played_games": [
            {
                "name": game["name"],
                "playtime_hours": round(
                    game.get("playtime_forever", 0) / 60,
                    1,
                ),
            }
            for game in most_played_games
        ],
    }
