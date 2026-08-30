# ReadOne

A modern blog application built with **React, Vite, and TypeScript**, with **Firebase** handling authentication and backend services. Users can create, edit, and delete blog posts using a rich-text editor powered by **CKEditor**.

## Features

* User authentication with Firebase
* Create new blog posts
* Edit existing blog posts
* Delete blog posts
* Rich-text blog editing with CKEditor
* Firebase backend integration
* Responsive React UI
* TypeScript for type safety
* Deployed on Vercel

## Tech Stack

* **React** - UI development
* **Vite** - Development and build tool
* **TypeScript** - Type-safe JavaScript
* **Firebase** - Authentication and backend/database
* **CKEditor** - Rich-text blog editor
* **Vercel** - Hosting and deployment

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm

### Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd readOne
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> Keep your environment variables private and do not commit the `.env` file to the repository.

### Run the Development Server

```bash
npm run dev
```

The application will be available at the local URL shown in your terminal, usually:

```text
http://localhost:5173
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```text
readOne/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── .env
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Authentication

Firebase Authentication is used to manage user authentication and authorization.

Authenticated users can:

* Sign up / log in
* Create blog posts
* Update their blog posts
* Delete their blog posts

## Blog Management

The application provides complete CRUD functionality for blog posts:

* **Create** - Add a new blog post
* **Read** - View published blog posts
* **Update** - Edit existing blog posts
* **Delete** - Remove blog posts

## Rich Text Editor

**CKEditor** is integrated to provide a rich-text editing experience when creating and updating blog posts.

It supports common formatting options such as:

* Headings
* Bold and italic text
* Lists
* Links
* Text formatting
* Other rich-text features

## Deployment

The application is hosted on **Vercel**.

For deployment:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the Firebase environment variables in Vercel.
4. Deploy the application.

## Live Demo

**Vercel:** `https://read-one-blog.vercel.app/`

## Repository

**GitHub:** `https://github.com/Adithyan408/ReadOne`

## License

This project is created for learning and development purposes.
