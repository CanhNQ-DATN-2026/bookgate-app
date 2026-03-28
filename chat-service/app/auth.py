import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .config import settings

bearer_scheme = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Verify token by calling api-service /auth/me.

    This replicates the monolith behaviour: token must be valid AND the user
    must still exist and be active.  If the call fails for any reason the
    request is rejected with 401/403.
    """
    token = credentials.credentials
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.API_SERVICE_URL}/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
    except Exception as e:
        print(f"[auth] could not reach api-service: {e!r}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication service unavailable",
        )

    if resp.status_code == 403:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = resp.json()
    return {"user_id": str(user["id"]), "role": user["role"], "token": token}
