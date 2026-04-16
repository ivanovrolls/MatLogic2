# MatLogic Setup Script (Windows PowerShell)
# Run this from the FightApp root directory

Write-Host "=== MatLogic Setup ===" -ForegroundColor Cyan

# Backend setup
Write-Host "`n--- Setting up Django backend ---" -ForegroundColor Yellow
Set-Location backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy env file
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env — edit your database credentials before continuing." -ForegroundColor Green
}

# Run migrations
python manage.py makemigrations accounts training techniques planning sparring competition
python manage.py migrate

# Create superuser
$ans = Read-Host "Create Django superuser? (y/n)"
if ($ans -eq "y") {
    python manage.py createsuperuser
}

Set-Location ..

# Frontend setup
Write-Host "`n--- Setting up Next.js frontend ---" -ForegroundColor Yellow
Set-Location frontend
npm install

if (-not (Test-Path ".env.local")) {
    "NEXT_PUBLIC_API_URL=http://localhost:8000/api" | Out-File ".env.local"
    Write-Host "Created frontend .env.local" -ForegroundColor Green
}

Set-Location ..

Write-Host "`n=== Setup complete! ===" -ForegroundColor Cyan
Write-Host "`nTo run the backend:"
Write-Host "  cd backend; .\venv\Scripts\Activate.ps1; python manage.py runserver"
Write-Host "`nTo run the frontend (new terminal):"
Write-Host "  cd frontend; npm run dev"
Write-Host "`nOr use Docker:"
Write-Host "  docker-compose up --build"
Write-Host "`nURLs:"
Write-Host "  Frontend:     http://localhost:3000"
Write-Host "  Backend API:  http://localhost:8000/api"
Write-Host "  Django Admin: http://localhost:8000/admin"
