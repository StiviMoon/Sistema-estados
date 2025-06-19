# Database 
import asyncpg
import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()


class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

        # Cargar credenciales desde .env
        self.host = os.getenv("SUPABASE_HOST")
        self.port = int(os.getenv("SUPABASE_PORT", 5432))
        self.user = os.getenv("SUPABASE_USER")
        self.password = os.getenv("SUPABASE_PASSWORD")
        self.database = os.getenv("SUPABASE_DATABASE")

        # Validar que tenemos todas las credenciales
        if not all([self.host, self.user, self.password, self.database]):
            raise ValueError("Missing database credentials in .env file")

    async def connect(self):
        """Crear pool de conexiones"""
        try:
            self.pool = await asyncpg.create_pool(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                ssl="require",
                min_size=1,
                max_size=10,
                command_timeout=60,
                server_settings={"jit": "off"},
                statement_cache_size=0  
            )
            print(f"✅ Database connected to {self.host}")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise

    async def disconnect(self):
        """Cerrar pool de conexiones"""
        if self.pool:
            await self.pool.close()
            print("❌ Database disconnected")

    async def execute_query(self, query: str, *args) -> List[Dict[str, Any]]:
        """Ejecutar query y retornar resultados"""
        if not self.pool:
            raise Exception("Database not connected")

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, *args)
            return [dict(row) for row in rows]

    async def execute_command(self, command: str, *args) -> str:
        """Ejecutar comando (INSERT/UPDATE/DELETE)"""
        if not self.pool:
            raise Exception("Database not connected")

        async with self.pool.acquire() as conn:
            return await conn.execute(command, *args)


# Instancia global
db = Database()
