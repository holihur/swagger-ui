package swaggerui

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestFSContainsUIAssets(t *testing.T) {
	for _, name := range []string{"index.html", "swagger-ui.css", "swagger-ui-bundle.js", "swagger-initializer.js"} {
		if _, err := FS.Open(name); err != nil {
			t.Fatalf("FS does not contain %s: %v", name, err)
		}
	}
}

func TestHandlerServesIndex(t *testing.T) {
	server := httptest.NewServer(NewHandler(Config{Title: "My API Docs"}))
	defer server.Close()

	resp, err := http.Get(server.URL + "/")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}
	if got := resp.Header.Get("Content-Type"); !strings.HasPrefix(got, "text/html") {
		t.Fatalf("unexpected content type %q", got)
	}

	body, _ := io.ReadAll(resp.Body)
	if !strings.Contains(string(body), "<title>My API Docs</title>") {
		t.Fatalf("title was not replaced:\n%s", body)
	}
}

func TestHandlerServesInitializerWithLanguages(t *testing.T) {
	handler := NewHandler(Config{
		Languages: []Language{
			{Name: "English", InstanceName: "swagger"},
			{Name: "中文", InstanceName: "swagger_zh_CN"},
		},
		PrimaryLanguage: "中文",
		BasePath:        "/swagger",
	})

	req := httptest.NewRequest(http.MethodGet, "/swagger/swagger-initializer.js", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	body := rec.Body.String()
	for _, want := range []string{
		`"name":"English"`,
		`"name":"中文"`,
		`"url":"/swagger/doc/swagger_zh_CN.json"`,
		`"languages.primaryName": "中文"`,
	} {
		if !strings.Contains(body, want) {
			t.Fatalf("initializer missing %q:\n%s", want, body)
		}
	}
}

func TestHandlerServesSpecViaProvider(t *testing.T) {
	provider := func(instanceName string) ([]byte, error) {
		return []byte(`{"instance":"` + instanceName + `"}`), nil
	}

	handler := NewHandler(Config{
		BasePath:     "/swagger",
		SpecProvider: provider,
		Languages: []Language{
			{Name: "English", InstanceName: "swagger"},
			{Name: "中文", InstanceName: "swagger_zh_CN"},
		},
	})

	req := httptest.NewRequest(http.MethodGet, "/swagger/doc/swagger_zh_CN.json", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if got := rec.Body.String(); got != `{"instance":"swagger_zh_CN"}` {
		t.Fatalf("unexpected body %q", got)
	}
	if got := rec.Header().Get("Content-Type"); !strings.HasPrefix(got, "application/json") {
		t.Fatalf("unexpected content type %q", got)
	}
}

func TestHandlerServesStaticAssetsUnderBasePath(t *testing.T) {
	handler := NewHandler(Config{BasePath: "/swagger"})

	req := httptest.NewRequest(http.MethodGet, "/swagger/swagger-ui.css", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	if rec.Body.Len() == 0 {
		t.Fatal("expected a non-empty stylesheet")
	}
}

func TestHandlerRootBasePath(t *testing.T) {
	handler := NewHandler(Config{})

	for _, target := range []string{"/", "/index.html", "/swagger-ui.css"} {
		req := httptest.NewRequest(http.MethodGet, target, nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("%s: expected 200, got %d", target, rec.Code)
		}
	}
}

func TestHandlerRejectsMethod(t *testing.T) {
	handler := NewHandler(Config{})

	req := httptest.NewRequest(http.MethodPost, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rec.Code)
	}
}

func TestHandlerNotFoundOutsideBasePath(t *testing.T) {
	handler := NewHandler(Config{BasePath: "/swagger"})

	req := httptest.NewRequest(http.MethodGet, "/other/index.html", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
}

func TestNormalizeBasePath(t *testing.T) {
	cases := map[string]string{
		"":          "",
		"/":         "",
		"swagger":   "/swagger",
		"/swagger/": "/swagger",
	}
	for in, want := range cases {
		if got := normalizeBasePath(in); got != want {
			t.Fatalf("normalizeBasePath(%q) = %q, want %q", in, got, want)
		}
	}
}
