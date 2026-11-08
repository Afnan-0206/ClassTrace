"""
ClassTrace Backend Server Runner.
Executes the FastAPI application using Uvicorn.
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path so 'backend.app' can be imported
# whether run from project root or inside backend directory
project_root = Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import uvicorn
from backend.app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
        log_level="info"
    )


