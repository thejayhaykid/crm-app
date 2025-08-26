# CRM Pro - Full-Stack Customer Relationship Management

A modern, full-featured CRM application built with Next.js 14, TypeScript, and SQLite. Designed for small to medium businesses to manage contacts, opportunities, and customer relationships effectively.

## 🚀 Features

- **Authentication**: Secure login/register with NextAuth.js and JWT
- **Dashboard**: Overview statistics and recent activity
- **Contact Management**: Complete CRUD operations with search and filtering
- **Opportunities Pipeline**: Kanban-style board with drag-and-drop status updates
- **Communication Logging**: Track emails, calls, meetings, and tasks
- **File Management**: Upload and manage documents
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Docker Ready**: Easy deployment with Docker and Docker Compose

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: ShadCN/UI with Radix UI primitives
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Validation**: Zod schemas throughout
- **State Management**: TanStack Query for client-side caching
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Docker with multi-stage builds

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker and Docker Compose (for containerized deployment)

## 🏃‍♂️ Quick Start

### Development Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
# .env file is already configured for development
# For production, update NEXTAUTH_SECRET with a secure value
```

3. **Initialize the database:**
```bash
npx prisma generate
npx prisma db push
```

4. **Start the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### First User Setup

1. Go to `/auth/signup` to create your first account
2. Sign in with your credentials
3. Start adding contacts and opportunities

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Update environment variables:**
Edit `docker-compose.yml` and set secure values for:
- `NEXTAUTH_SECRET`: Generate a secure random string
- `NEXTAUTH_URL`: Your production URL

2. **Deploy with Docker Compose:**
```bash
docker-compose up -d
```

3. **Access the application:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Manual Docker Build

1. **Build the image:**
```bash
docker build -t crm-app .
```

2. **Run the container:**
```bash
docker run -d \
  --name crm-app \
  -p 3000:3000 \
  -v crm_data:/app/data \
  -v crm_uploads:/app/uploads \
  -e NEXTAUTH_SECRET="your-secure-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  crm-app
```

## 📊 Database Schema

The application uses SQLite with the following main entities:

- **Users**: Authentication and user profiles
- **Contacts**: Customer contact information
- **Opportunities**: Sales pipeline management
- **Communications**: Interaction tracking
- **Activities**: Task and activity management
- **Notes**: Free-form notes and comments
- **Documents**: File attachments
- **Tags**: Categorization system

## 🔐 Security Features

- Password hashing with bcrypt
- JWT-based session management
- User-scoped data isolation
- Input validation with Zod
- SQL injection protection with Prisma
- XSS protection with Next.js built-ins

## 🎨 Customization

### UI Theming
The application uses Tailwind CSS with CSS variables for theming. Modify `src/app/globals.css` to customize colors and styling.

### Database Schema
To modify the database schema:

1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to update the client

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/signin` - Sign in user

### Contact Endpoints  
- `GET /api/contacts` - List contacts with pagination
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Opportunity Endpoints
- `GET /api/opportunities` - List opportunities (includes kanban data)
- `POST /api/opportunities` - Create new opportunity
- `PUT /api/opportunities/[id]` - Update opportunity
- `DELETE /api/opportunities/[id]` - Delete opportunity

## 🚀 Production Deployment

### Environment Variables

Set these environment variables in production:

```bash
DATABASE_URL="file:/app/data/production.db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-very-secure-secret-key"
NODE_ENV="production"
```

## 🔧 Development

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Reusable UI components
├── lib/                   # Utility functions and configs
└── types/                 # TypeScript type definitions
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open database GUI

Built with ❤️ using Next.js 14 and modern web technologies.
