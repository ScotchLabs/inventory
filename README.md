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
3. run the following for something
``` bash
    docker-compose up -d
```
4. run the following to start server on http://localhost:8000
``` bash
    uv run uvicorn app.app:app --reload
```   
   Remove the reload flag if you'd like to stop the server from refreshing for file changes

5. if you made changes since last time (?) then migrate:
``` bash
    uv run alembic upgrade head
```

6. To interact, use curl (changing the values in the json)
>>>>>>> refs/remotes/origin/main
``` bash
    curl -X POST http://localhost:8000/ -H "Content-Type: application/json" -d '{"username":"test"}'
```
7. to actually view the database, make sure you have `postgresql` installed and then run
``` bash
    psql -h localhost -p 5432 -U user -d db
```
   the password is `password` lol
   then also do `exit;` to get out of SQL and stuff


## Frontend:
To edit with Mantine:
``` bash
npm install @mantine/core @mantine/hooks
```

To look at the frontend (cd into the folder):
``` bash
    npm run dev
```
Type q to exit. 
Have the sql running to make sure the two are working together as expected

## TODO

- [x] Framwork for frontend/backend
- [x] @willschremmer implement create/delete asset functions
- [ ] @mkengland frontend buttons