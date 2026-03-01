"""
Auth endpoints — JWT + OAuth authentication.
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
async def login(email: str = "", password: str = ""):
    """Login with email and password."""
    # TODO: Implement with auth_service
    return {"access_token": "placeholder", "token_type": "bearer"}


@router.post("/register")
async def register(name: str = "", email: str = "", password: str = ""):
    """Register a new user."""
    # TODO: Implement
    return {"id": "placeholder", "name": name, "email": email}


@router.post("/refresh")
async def refresh_token(refresh_token: str = ""):
    """Refresh an access token."""
    # TODO: Implement
    return {"access_token": "placeholder"}


@router.post("/oauth/{provider}")
async def oauth_callback(provider: str, code: str = ""):
    """Handle OAuth callback."""
    # TODO: Implement
    return {"access_token": "placeholder", "provider": provider}
