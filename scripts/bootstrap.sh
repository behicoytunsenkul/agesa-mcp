#!/usr/bin/env bash
# Eski bootstrap → yeni stack-reset
exec "$(cd "$(dirname "$0")" && pwd)/stack-reset.sh" "$@"
