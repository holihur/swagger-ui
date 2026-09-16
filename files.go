// Package swaggerui embeds the Swagger UI distribution and serves it over
// HTTP. It is a drop-in alternative to github.com/swaggo/files that also
// supports the multi-language switcher added to this fork.
package swaggerui

import (
	"embed"
	"io/fs"
)

//go:embed all:dist
var dist embed.FS

// FS exposes the embedded Swagger UI distribution (the contents of dist/).
// It can be used with http.FileServer, for example:
//
//	http.FileServer(http.FS(swaggerui.FS))
var FS, _ = fs.Sub(dist, "dist")
