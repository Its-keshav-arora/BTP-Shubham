# Protein-Ligand Interactions | IIT Ropar

User and Admin portals for protein-ligand simulation requests. Built with React, Express, MongoDB, JWT, and Cloudinary.

## Setup

### 1. Backend (server)

```bash
cd btp/server
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Cloudinary credentials, and admin email/password
npm install
```

### 2. Frontend (React)

```bash
cd btp
npm install
```

### 3. Run

**Terminal 1 – backend**
```bash
cd btp
npm run server
```

**Terminal 2 – frontend**
```bash
cd btp
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000

## Environment variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Default admin login |
| `CLOUDINARY_*` | Cloudinary credentials for file uploads |

## Features

- **User portal**: Login, register, dashboard with protein/ligand name inputs, `.pdb` uploads (protein + ligand), and results selection
- **Admin portal**: View submissions and download uploaded files
- **Authentication**: JWT-based auth
- **File storage**: `.pdb` files stored on Cloudinary
