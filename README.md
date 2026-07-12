## Getting started:
Please ensure you have `uv` and `npm` (use `NVM` in install) installed.  
Run inside backend
```bash
uv sync
```
Run inside frontend
```bash
npm install
```

Alternatively, run the following inside your parent folder
```bash
chmod +x ./setup.sh
./setup.sh
```

## Backend:
To run the backend in terminal:

1. cd into backend
2. make a .env file in backend based on the `DATABASE_URL` found in `.env.example`
3. run the following to start server on http://localhost:8000
``` bash
    uv run uvicorn app.app:app --reload
```   
Remove the reload flag if you'd like to stop the server from refreshing for file changes
4. To interact, use curl
``` bash
    curl -X POST http://localhost:8000/ -H "Content-Type: application/json" -d '{"username":"test"}'
```


## Frontend:
To look at the frontend:
``` bash
    npm run dev
```
Type q to exit. 
Have the sql running to make sure the two are working together as expected!

## TODO

- [x] Framwork for frontend/backend
- [ ] @willschremmer implement create/delete asset functions
- [ ] @mkengland frontend buttons