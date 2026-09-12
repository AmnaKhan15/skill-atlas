"""Environment-driven configuration. Nothing here is a secret — the
values themselves are read from the environment, never hard-coded."""
import os
from dataclasses import dataclass
from pathlib import Path

# Load a local .env file in development. In production (Render, etc.)
# real environment variables are set in the platform dashboard instead.
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except ImportError:
    pass


@dataclass(frozen=True)
class Settings:
    cognodb_uri: str
    cognodb_user: str
    cognodb_password: str
    cognodb_database: str
    cors_origins: list


def get_settings() -> Settings:
    return Settings(
        cognodb_uri=os.environ.get("COGNODB_URI", ""),
        cognodb_user=os.environ.get("COGNODB_USER", "cognodb"),
        cognodb_password=os.environ.get("COGNODB_PASSWORD", ""),
        cognodb_database=os.environ.get("COGNODB_DATABASE", "neo4j"),
        cors_origins=[
            o.strip()
            for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
            if o.strip()
        ],
    )


settings = get_settings()
