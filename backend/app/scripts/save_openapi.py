import json
from fastapi.openapi.utils import get_openapi
from app.app import app


if __name__ == "__main__":
    # Ensure all routes are loaded before generating the schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    with open("dist/openapi.json", "w") as f:
        json.dump(openapi_schema, f, indent=2)