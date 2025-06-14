from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    supabase_host: str
    supabase_port: int = 5432
    supabase_user: str = "postgres"
    supabase_password: str
    supabase_database: str = "postgres"

    # App
    debug: bool = False
    app_name: str = "Sainapsis Order Management"
    app_version: str = "1.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
