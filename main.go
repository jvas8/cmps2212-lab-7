package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type Registration struct {
	ID        int    `json:"id"`
	EventDate string `json:"eventDate"`
	Tickets   int    `json:"tickets"`
}

type application struct {
	logger        *slog.Logger
	mu            sync.Mutex
	registrations []Registration
	nextID        int
}

func (app *application) createRegistration(w http.ResponseWriter, r *http.Request) {
	var input struct {
		EventDate string `json:"eventDate"`
		Tickets   int    `json:"tickets"`
	}

	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	input.EventDate = strings.TrimSpace(input.EventDate)

	if input.EventDate == "" {
		http.Error(w, "eventDate is required", http.StatusBadRequest)
		return
	}

	date, err := time.Parse("2006-01-02", input.EventDate)
	if err != nil {
		http.Error(w, "invalid date format", http.StatusBadRequest)
		return
	}

	today := time.Now().Truncate(24 * time.Hour)
	if !date.After(today) {
		http.Error(w, "date must be in the future", http.StatusBadRequest)
		return
	}

	if input.Tickets < 1 || input.Tickets > 5 {
		http.Error(w, "tickets must be between 1 and 5", http.StatusBadRequest)
		return
	}

	app.mu.Lock()
	app.nextID++
	reg := Registration{
		ID:        app.nextID,
		EventDate: input.EventDate,
		Tickets:   input.Tickets,
	}
	app.registrations = append(app.registrations, reg)
	app.mu.Unlock()

	app.logger.Info("registration created", "id", reg.ID, "date", reg.EventDate, "tickets", reg.Tickets)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reg)
}

func (app *application) listRegistrations(w http.ResponseWriter, r *http.Request) {
	app.mu.Lock()
	regs := make([]Registration, len(app.registrations))
	copy(regs, app.registrations)
	app.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(regs)
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	app := &application{
		logger:        logger,
		registrations: []Registration{},
		nextID:        0,
	}

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/registrations", app.createRegistration)
	mux.HandleFunc("GET /api/registrations", app.listRegistrations)

	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/", fs)

	addr := ":4000"
	logger.Info("starting server", "addr", addr)

	err := http.ListenAndServe(addr, mux)
	logger.Error(err.Error())
	os.Exit(1)
}