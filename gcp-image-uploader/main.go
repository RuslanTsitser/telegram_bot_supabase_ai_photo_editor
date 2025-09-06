package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"google.golang.org/genai"
)

// Request структура для входящего запроса
type Request struct {
	ImageURL string `json:"imageUrl"`
	Caption  string `json:"caption,omitempty"`
	Model    string `json:"model,omitempty"`
}

// Response структура для ответа
type Response struct {
	Success     bool   `json:"success"`
	ImageData   string `json:"imageData,omitempty"` // base64 encoded image
	MimeType    string `json:"mimeType,omitempty"`
	OriginalURL string `json:"originalUrl,omitempty"`
	Error       string `json:"error,omitempty"`
}

// Функция, которая принимает URL и возвращает байты изображения и MIME-тип
func GetImageBytes(url string) ([]byte, string, error) {
	response, err := http.Get(url)
	if err != nil {
		return nil, "", err
	}
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, "", err
	}

	// Получаем MIME-тип из заголовков
	mimeType := response.Header.Get("Content-Type")
	if mimeType == "" || mimeType == "application/octet-stream" {
		// Определяем MIME-тип по содержимому файла
		if len(body) > 4 {
			// Проверяем сигнатуры файлов
			if body[0] == 0xFF && body[1] == 0xD8 {
				mimeType = "image/jpeg"
			} else if body[0] == 0x89 && body[1] == 0x50 && body[2] == 0x4E && body[3] == 0x47 {
				mimeType = "image/png"
			} else if body[0] == 0x47 && body[1] == 0x49 && body[2] == 0x46 {
				mimeType = "image/gif"
			} else if body[0] == 0x52 && body[1] == 0x49 && body[2] == 0x46 && body[3] == 0x46 {
				mimeType = "image/webp"
			} else {
				mimeType = "image/jpeg" // fallback
			}
		} else {
			mimeType = "image/jpeg" // fallback
		}
	}

	return body, mimeType, nil
}

// Запрос в Google AI
func UploadFileToGoogleAI(bytes []byte, mimeType string, caption string) ([]byte, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	ctx := context.Background()
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY environment variable is not set")
	}

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey: apiKey,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create client: %w", err)
	}

	fmt.Println("Caption:", caption)
	fmt.Println("MimeType:", mimeType)
	fmt.Println("Bytes:", len(bytes))

	parts := []*genai.Part{
		genai.NewPartFromBytes(bytes, mimeType),
		genai.NewPartFromText(caption),
	}

	contents := []*genai.Content{
		genai.NewContentFromParts(parts, genai.RoleUser),
	}

	// Конфигурация для генерации изображений
	config := &genai.GenerateContentConfig{
		ResponseModalities: []string{
			"TEXT",
			"IMAGE",
		},
	}

	model := "gemini-2.5-flash-image-preview"

	result, err := client.Models.GenerateContent(
		ctx,
		model,
		contents,
		config,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	candidate := result.Candidates[0]
	resultParts := candidate.Content.Parts

	fmt.Println("Result candidates:", len(result.Candidates))
	fmt.Println("Result parts:", len(resultParts))

	for _, part := range resultParts {
		if part.InlineData != nil {
			return part.InlineData.Data, nil
		}
	}

	return nil, fmt.Errorf("no image data in response")
}

// API функция для обработки HTTP запросов
func uploadImageHandler(w http.ResponseWriter, r *http.Request) {
	// Устанавливаем CORS заголовки
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	// Обрабатываем preflight запросы
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Проверяем метод запроса
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Парсим JSON запрос
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, "Invalid JSON", err.Error())
		return
	}

	// Проверяем наличие URL
	if req.ImageURL == "" || req.Caption == "" {
		respondWithError(w, "imageUrl, model and caption are required", "")
		return
	}

	// Получаем байты изображения
	fmt.Println("Downloading image from:", req.ImageURL)
	imageBytes, mimeType, err := GetImageBytes(req.ImageURL)
	if err != nil {
		fmt.Println("Error downloading image:", err)
		respondWithError(w, "Failed to download image", err.Error())
		return
	}
	fmt.Println("Image downloaded successfully, size:", len(imageBytes), "bytes, MIME type:", mimeType)

	resultBytes, err := UploadFileToGoogleAI(imageBytes, mimeType, req.Caption)
	if err != nil {
		fmt.Println("Error uploading to Google AI:", err)
		respondWithError(w, "Failed to upload to Google AI", err.Error())
		return
	}

	// Кодируем изображение в base64
	imageData := base64.StdEncoding.EncodeToString(resultBytes)

	// Возвращаем успешный результат
	response := Response{
		Success:     true,
		ImageData:   imageData,
		MimeType:    "image/png", // Gemini возвращает PNG
		OriginalURL: req.ImageURL,
	}

	json.NewEncoder(w).Encode(response)
}

// Функция для отправки ошибок
func respondWithError(w http.ResponseWriter, errorMsg, detail string) {
	w.WriteHeader(http.StatusBadRequest)
	json.NewEncoder(w).Encode(Response{
		Success: false,
		Error:   errorMsg,
	})
}

func main() {
	// Регистрируем маршрут
	http.HandleFunc("/upload", uploadImageHandler)

	// Запускаем сервер
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)
	http.ListenAndServe(":"+port, nil)
}
