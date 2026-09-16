package swaggerui

import (
	"encoding/json"
	"html"
	"io"
	"io/fs"
	"net/http"
	"path"
	"strings"
	"text/template"
)

// Language describes an available UI language.
type Language struct {
	// Name is the label shown in the language switcher.
	Name string
	// URL points to the OpenAPI document for this language. When empty and
	// InstanceName is set, the handler serves it itself.
	URL string
	// InstanceName identifies the document when SpecProvider is configured.
	InstanceName string
}

// SpecProvider returns the raw OpenAPI document for an instance name.
// It is typically a thin wrapper around swag.ReadDoc:
//
//	func(name string) ([]byte, error) {
//		doc, err := swag.ReadDoc(name)
//		return []byte(doc), err
//	}
type SpecProvider func(instanceName string) ([]byte, error)

// Config configures the Swagger UI handler.
type Config struct {
	// URL is the default OpenAPI document. It is ignored when Languages is set.
	URL string

	// Languages enables the language switcher.
	Languages []Language

	// PrimaryLanguage selects the default language by name.
	PrimaryLanguage string

	// SpecProvider, when set together with Language.InstanceName, lets the
	// handler serve the OpenAPI documents itself instead of relying on
	// external routes.
	SpecProvider SpecProvider

	// Title is the HTML page title. Defaults to "Swagger UI".
	Title string

	// BasePath is the URL prefix the UI is served under, e.g. "/swagger".
	// Defaults to "/".
	BasePath string

	// DocExpansion controls the initial expansion of operations and models:
	// "list" (default), "full" or "none".
	DocExpansion string

	// DeepLinking enables deep linking.
	DeepLinking bool

	// PersistAuthorization persists authorization data between page reloads.
	PersistAuthorization bool

	// ValidatorURL sets the swagger validator URL. When empty the validator
	// is disabled.
	ValidatorURL string
}

type handler struct {
	cfg    Config
	assets http.Handler
}

// NewHandler returns an http.Handler serving the embedded Swagger UI.
func NewHandler(cfg Config) http.Handler {
	cfg = cfg.withDefaults()

	return &handler{
		cfg:    cfg,
		assets: http.FileServer(http.FS(FS)),
	}
}

func (c Config) withDefaults() Config {
	if c.Title == "" {
		c.Title = "Swagger UI"
	}
	if c.DocExpansion == "" {
		c.DocExpansion = "list"
	}
	c.BasePath = normalizeBasePath(c.BasePath)

	for i := range c.Languages {
		if c.Languages[i].URL == "" && c.Languages[i].InstanceName != "" {
			c.Languages[i].URL = joinURL(c.BasePath, "/doc/"+c.Languages[i].InstanceName+".json")
		}
	}

	return c
}

// normalizeBasePath returns "" for the root path and "/prefix" otherwise.
func normalizeBasePath(basePath string) string {
	basePath = "/" + strings.Trim(basePath, "/")
	if basePath == "/" {
		return ""
	}
	return basePath
}

func joinURL(basePath, urlPath string) string {
	return basePath + "/" + strings.TrimPrefix(urlPath, "/")
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	rel, ok := h.relativePath(r.URL.Path)
	if !ok {
		http.NotFound(w, r)
		return
	}

	switch {
	case rel == "" || rel == "index.html":
		h.serveIndex(w, r)
	case rel == "swagger-initializer.js":
		h.serveInitializer(w, r)
	case strings.HasPrefix(rel, "doc/") && h.cfg.SpecProvider != nil:
		h.serveSpec(w, r, strings.TrimPrefix(rel, "doc/"))
	default:
		h.serveAsset(w, r, rel)
	}
}

func (h *handler) relativePath(urlPath string) (string, bool) {
	cleaned := path.Clean("/" + urlPath)

	if h.cfg.BasePath != "" {
		if cleaned == h.cfg.BasePath {
			return "", true
		}
		if !strings.HasPrefix(cleaned, h.cfg.BasePath+"/") {
			return "", false
		}
		cleaned = strings.TrimPrefix(cleaned, h.cfg.BasePath)
	}

	return strings.TrimPrefix(cleaned, "/"), true
}

func (h *handler) serveAsset(w http.ResponseWriter, r *http.Request, rel string) {
	clone := r.Clone(r.Context())
	clone.URL.Path = "/" + rel
	clone.URL.RawPath = ""
	h.assets.ServeHTTP(w, clone)
}

func (h *handler) serveIndex(w http.ResponseWriter, r *http.Request) {
	data, err := fs.ReadFile(FS, "index.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	page := string(data)
	title := html.EscapeString(h.cfg.Title)
	page = strings.Replace(page, "<title>Swagger UI</title>", "<title>"+title+"</title>", 1)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if r.Method != http.MethodHead {
		_, _ = io.WriteString(w, page)
	}
}

func (h *handler) serveSpec(w http.ResponseWriter, r *http.Request, name string) {
	name = strings.TrimSuffix(path.Base(name), ".json")

	doc, err := h.cfg.SpecProvider(name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if r.Method != http.MethodHead {
		_, _ = w.Write(doc)
	}
}

var initializerTemplate = template.Must(template.New("swagger-initializer").Parse(`window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: {{.URL}},
    {{if .Languages}}languages: {{.Languages}},
    "languages.primaryName": {{.PrimaryLanguage}},
    {{end}}dom_id: '#swagger-ui',
    deepLinking: {{.DeepLinking}},
    docExpansion: {{.DocExpansion}},
    persistAuthorization: {{.PersistAuthorization}},
    validatorUrl: {{.ValidatorURL}},
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  })
}
`))

type jsLanguage struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

func (h *handler) serveInitializer(w http.ResponseWriter, r *http.Request) {
	data := struct {
		URL                  string
		Languages            string
		PrimaryLanguage      string
		DeepLinking          bool
		DocExpansion         string
		PersistAuthorization bool
		ValidatorURL         string
	}{
		URL:                  toJSON(h.cfg.URL),
		PrimaryLanguage:      toJSON(h.cfg.PrimaryLanguage),
		DeepLinking:          h.cfg.DeepLinking,
		DocExpansion:         toJSON(h.cfg.DocExpansion),
		PersistAuthorization: h.cfg.PersistAuthorization,
		ValidatorURL:         "null",
	}

	if len(h.cfg.Languages) > 0 {
		languages := make([]jsLanguage, 0, len(h.cfg.Languages))
		for _, language := range h.cfg.Languages {
			languages = append(languages, jsLanguage{Name: language.Name, URL: language.URL})
		}
		raw, _ := json.Marshal(languages)
		data.Languages = string(raw)
	}

	if h.cfg.ValidatorURL != "" {
		data.ValidatorURL = toJSON(h.cfg.ValidatorURL)
	}

	w.Header().Set("Content-Type", "application/javascript; charset=utf-8")

	if r.Method == http.MethodHead {
		return
	}

	if err := initializerTemplate.Execute(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func toJSON(value string) string {
	raw, err := json.Marshal(value)
	if err != nil {
		return `""`
	}
	return string(raw)
}
