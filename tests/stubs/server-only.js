// Stub for the "server-only" package in Vitest. Next.js's bundler
// special-cases this import (no-op in real server code, throws in code
// accidentally bundled for the client); outside Next's bundler entirely
// (plain Vitest), the real package always throws regardless of context, so
// it's aliased here to a no-op instead.
