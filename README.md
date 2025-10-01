# BlurLeads Backend

NestJS backend API for BlurLeads.

## Setup

```bash
npm install
# or
pnpm install
# or
yarn install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Database

Run Prisma migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

## Development

```bash
npm run start:dev
```

API will be available at [http://localhost:3001](http://localhost:3001)

## Build

```bash
npm run build
npm run start:prod
```

## Testing

```bash
npm test
npm run test:watch
npm run test:e2e
```

## Type Checking

```bash
npm run type-check
```

## API Documentation

Swagger API docs available at `/api/docs` when running.
