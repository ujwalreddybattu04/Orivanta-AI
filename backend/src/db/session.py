"""Async database session factory with production-grade pool settings."""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from src.config.settings import settings

# Production pool settings:
# pool_size=10  — persistent connections per worker
# max_overflow=20 — burst capacity above pool_size
# pool_recycle=1800 — recycle connections every 30 min (prevents stale TCP)
# pool_timeout=30  — raise error after 30s waiting for a free connection
# pool_pre_ping=True — test connection health before use
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    pool_timeout=30,
    # Required when using PgBouncer in transaction mode
    connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0}
    if "asyncpg" in settings.DATABASE_URL else {},
)

async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
