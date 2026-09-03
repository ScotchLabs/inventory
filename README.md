## Getting started:


## Additional scripts
### Frontend
- `make spec` to sync openapi schema from backend to frontend
- `npm run format` to format with `prettier` & `npm run lint:fix` to lint

### Backend
- `make spec` to rewrite the openapi spec to `backend/dist/openapi`
- `make format` to format using `ruff`
- `make check` to lint using `ruff`
- `make fix` to format + lint fix whatever you can.
  - If trying to configure mappers, you can use  `# noqa` for wildcard imports
