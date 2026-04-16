#!/bin/bash
# MatLogic Setup Script
# Run this from the FightApp root directory

set -e

echo "=== MatLogic Setup ==="

# Backend setup
echo ""
echo "--- Setting up Django backend ---"
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit your DB credentials before continuing."
fi

# Run migrations
python manage.py makemigrations accounts training techniques planning sparring competition analytics
python manage.py migrate

# Create superuser (optional)
echo "Create superuser? (y/n)"
read ans
if [ "$ans" = "y" ]; then
  python manage.py createsuperuser
fi

cd ..

# Frontend setup
echo ""
echo "--- Setting up Next.js frontend ---"
cd frontend
npm install

# Copy env
if [ ! -f .env.local ]; then
  echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
  echo "Created frontend .env.local"
fi

cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To run the backend:"
echo "  cd backend && source venv/bin/activate && python manage.py runserver"
echo ""
echo "To run the frontend (in another terminal):"
echo "  cd frontend && npm run dev"
echo ""
echo "Or use Docker Compose:"
echo "  docker-compose up --build"
echo ""
echo "App will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000/api"
echo "  Django Admin: http://localhost:8000/admin"
