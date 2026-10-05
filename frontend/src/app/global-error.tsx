"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es-MX">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f5f2",
          color: "#191919",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <title>Algo salió mal · Sports League</title>
        <main
          style={{
            maxWidth: "28rem",
            width: "100%",
            background: "#fbfaf7",
            border: "1px solid #c4c3bf",
            borderRadius: "1rem",
            padding: "1.5rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
            Algo salió mal
          </h1>
          <p style={{ margin: "0 0 1rem", color: "#585858", lineHeight: 1.5 }}>
            No pudimos cargar la aplicación. Vuelve a intentarlo en un momento.
            {error.digest ? ` (Código: ${error.digest})` : null}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: "#dae937",
              color: "#191919",
              border: "none",
              borderRadius: "9999px",
              padding: "0.625rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
