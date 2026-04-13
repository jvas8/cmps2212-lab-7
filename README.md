# Lab 7 – Event Registration
# Name: Jeimy Vasquez

Cinnamoroll-themed event registration form with validation and a Go API.

## Run

```bash
go run main.go
```

Then open `http://localhost:4000`

## Features

- Event date (must be a future date)
- Number of tickets (1–5 only)
- Terms & Conditions checkbox (must be checked)
- Observer Pattern via custom event emitter
- POST to `/api/registrations` Go backend
