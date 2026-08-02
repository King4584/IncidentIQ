from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

db_url = settings.DATABASE_URL
# Graceful fallback if driver not pre-installed in environment
try:
    import aiosqlite
except ImportError:
    if db_url.startswith("sqlite+aiosqlite"):
        db_url = "sqlite:///./incidentiq.db"

engine_args = {"echo": False}
if "sqlite" in db_url:
    engine_args["connect_args"] = {"check_same_thread": False}

if db_url.startswith("sqlite://"):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    sync_engine = create_engine(db_url, **engine_args)
    SyncSessionLocal = sessionmaker(bind=sync_engine, autoflush=False, autocommit=False)
    
    # Session wrapper for dual compatibility
    class SyncToAsyncSessionAdapter:
        def __init__(self, sync_session):
            self.session = sync_session

        async def execute(self, statement, *args, **kwargs):
            return self.session.execute(statement, *args, **kwargs)

        def add(self, instance):
            self.session.add(instance)

        async def commit(self):
            self.session.commit()

        async def rollback(self):
            self.session.rollback()

        async def refresh(self, instance):
            self.session.refresh(instance)

        async def flush(self):
            self.session.flush()

        async def close(self):
            self.session.close()

    class AsyncSessionLocalContext:
        def __call__(self):
            return self

        async def __aenter__(self):
            self.session = SyncSessionLocal()
            self.adapter = SyncToAsyncSessionAdapter(self.session)
            return self.adapter

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            if exc_type:
                await self.adapter.rollback()
            else:
                await self.adapter.commit()
            await self.adapter.close()

    async_engine = sync_engine
    AsyncSessionLocal = AsyncSessionLocalContext()

    async def get_db():
        async with AsyncSessionLocal() as session:
            yield session

else:
    async_engine = create_async_engine(db_url, **engine_args)
    AsyncSessionLocal = async_sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async def get_db() -> AsyncGenerator[AsyncSession, None]:
        async with AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
