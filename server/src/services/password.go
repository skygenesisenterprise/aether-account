package services

import (
	"fmt"
	"strconv"
	"time"
)

type PasswordService struct {
	db *DatabaseService
}

func NewPasswordService(db *DatabaseService) *PasswordService {
	return &PasswordService{db: db}
}

type PasswordEntry struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Username  string `json:"username"`
	Password  string `json:"-"`
	URL       string `json:"url,omitempty"`
	Favorite  bool   `json:"favorite"`
	Category  string `json:"category"`
	Notes     string `json:"notes,omitempty"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func (s *PasswordService) ListPasswords(userID string) ([]PasswordEntry, error) {
	passwords, err := s.db.ListPasswords(userID)
	if err != nil {
		return nil, err
	}

	result := make([]PasswordEntry, len(passwords))
	for i, p := range passwords {
		result[i] = PasswordEntry{
			ID:        p.ID,
			Name:      p.Name,
			Username:  p.Username,
			Password:  "********",
			URL:       p.URL,
			Favorite:  p.Favorite,
			Category:  p.Category,
			Notes:     p.Notes,
			CreatedAt: p.CreatedAt.Format(time.RFC3339),
			UpdatedAt: p.UpdatedAt.Format(time.RFC3339),
		}
	}

	return result, nil
}

func (s *PasswordService) GetPassword(passwordID, userID string) (*PasswordEntry, error) {
	password, err := s.db.GetPassword(passwordID, userID)
	if err != nil {
		return nil, err
	}

	return &PasswordEntry{
		ID:        password.ID,
		Name:      password.Name,
		Username:  password.Username,
		Password:  password.Password,
		URL:       password.URL,
		Favorite:  password.Favorite,
		Category:  password.Category,
		Notes:     password.Notes,
		CreatedAt: password.CreatedAt.Format(time.RFC3339),
		UpdatedAt: password.UpdatedAt.Format(time.RFC3339),
	}, nil
}

func (s *PasswordService) CreatePassword(userID string, req CreatePasswordRequest) (*PasswordEntry, error) {
	password := Password{
		ID:        strconv.FormatInt(time.Now().UnixNano(), 10),
		Name:      req.Name,
		Username:  req.Username,
		Password:  req.Password,
		URL:       req.URL,
		Favorite:  false,
		Category:  req.Category,
		Notes:     req.Notes,
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.CreatePassword(&password); err != nil {
		return nil, err
	}

	return &PasswordEntry{
		ID:        password.ID,
		Name:      password.Name,
		Username:  password.Username,
		Password:  "********",
		URL:       password.URL,
		Favorite:  password.Favorite,
		Category:  password.Category,
		Notes:     password.Notes,
		CreatedAt: password.CreatedAt.Format(time.RFC3339),
		UpdatedAt: password.UpdatedAt.Format(time.RFC3339),
	}, nil
}

func (s *PasswordService) UpdatePassword(passwordID, userID string, req UpdatePasswordRequest) (*PasswordEntry, error) {
	updates := map[string]interface{}{}

	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Username != "" {
		updates["username"] = req.Username
	}
	if req.Password != "" {
		updates["password"] = req.Password
	}
	if req.URL != "" {
		updates["url"] = req.URL
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if req.Favorite != nil {
		updates["favorite"] = *req.Favorite
	}

	password, err := s.db.UpdatePassword(passwordID, userID, updates)
	if err != nil {
		return nil, err
	}

	return &PasswordEntry{
		ID:        password.ID,
		Name:      password.Name,
		Username:  password.Username,
		Password:  "********",
		URL:       password.URL,
		Favorite:  password.Favorite,
		Category:  password.Category,
		Notes:     password.Notes,
		CreatedAt: password.CreatedAt.Format(time.RFC3339),
		UpdatedAt: password.UpdatedAt.Format(time.RFC3339),
	}, nil
}

func (s *PasswordService) DeletePassword(passwordID, userID string) error {
	return s.db.DeletePassword(passwordID, userID)
}

func (s *PasswordService) ToggleFavorite(passwordID, userID string) error {
	password, err := s.db.GetPassword(passwordID, userID)
	if err != nil {
		return err
	}

	return s.db.UpdatePasswordField(passwordID, "favorite", !password.Favorite)
}

func (s *PasswordService) SearchPasswords(userID, query string) ([]PasswordEntry, error) {
	passwords, err := s.db.SearchPasswords(userID, query)
	if err != nil {
		return nil, err
	}

	result := make([]PasswordEntry, len(passwords))
	for i, p := range passwords {
		result[i] = PasswordEntry{
			ID:        p.ID,
			Name:      p.Name,
			Username:  p.Username,
			Password:  "********",
			URL:       p.URL,
			Favorite:  p.Favorite,
			Category:  p.Category,
			Notes:     p.Notes,
			CreatedAt: p.CreatedAt.Format(time.RFC3339),
			UpdatedAt: p.UpdatedAt.Format(time.RFC3339),
		}
	}

	return result, nil
}

func (s *PasswordService) GetPasswordCategories(userID string) ([]string, error) {
	passwords, err := s.db.ListPasswords(userID)
	if err != nil {
		return nil, err
	}

	categorySet := make(map[string]bool)
	for _, p := range passwords {
		if p.Category != "" {
			categorySet[p.Category] = true
		}
	}

	categories := make([]string, 0, len(categorySet))
	for cat := range categorySet {
		categories = append(categories, cat)
	}

	return categories, nil
}

type CreatePasswordRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Password string `json:"password"`
	URL      string `json:"url,omitempty"`
	Category string `json:"category"`
	Notes    string `json:"notes,omitempty"`
}

type UpdatePasswordRequest struct {
	Name     string `json:"name,omitempty"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
	URL      string `json:"url,omitempty"`
	Category string `json:"category,omitempty"`
	Notes    string `json:"notes,omitempty"`
	Favorite *bool  `json:"favorite,omitempty"`
}

type PasswordListResponse struct {
	Success bool            `json:"success"`
	Data    []PasswordEntry `json:"data,omitempty"`
	Error   string          `json:"error,omitempty"`
}

type PasswordResponse struct {
	Success bool           `json:"success"`
	Data    *PasswordEntry `json:"data,omitempty"`
	Error   string         `json:"error,omitempty"`
}

func NewPasswordServiceError(message string) error {
	return fmt.Errorf("password service error: %s", message)
}
