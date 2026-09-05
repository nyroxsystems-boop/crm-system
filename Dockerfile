# ============================================================================
# CRM-System — React + Vite, Auslieferung über nginx
#
# Vorher lief hier `serve -s dist`. Das leitet JEDEN nicht gefundenen Pfad auf
# index.html um — auch ein /assets/index-ALT.js. Der Browser bekam dort HTML
# mit Status 200, wo er JavaScript erwartete, und das CRM zeigte nur noch:
#     TypeError: 'text/html' is not a valid JavaScript MIME type.
# Passiert bei JEDEM Deployment, weil Vite neue Dateinamen mit Pruefsumme
# vergibt. Am 2026-07-29 hat es das CRM lahmgelegt.
#
# nginx erlaubt die noetige Unterscheidung (fehlende Bausteine -> 404, Routen
# -> index.html) und ist ausserdem das, was das Admin-Dashboard schon nutzt.
# Nebenbei faellt `serve` als Laufzeit-Abhaengigkeit weg.
# ============================================================================
FROM node:22.23.2-alpine AS builder

ARG VITE_API_BASE_URL=https://api.partsunion.de
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund --no-progress
COPY . .
RUN npm run build

# ---- Laufzeit ----
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Vorlage, damit ${PORT} beim Start eingesetzt wird — nginx:alpine fuehrt
# /docker-entrypoint.d/20-envsubst-on-templates.sh von selbst aus.
COPY nginx.conf /etc/nginx/templates/default.conf.template

ENV PORT=5000
EXPOSE 5000
# 127.0.0.1 statt "localhost": im Container loest localhost zuerst auf IPv6 ::1
# auf, nginx lauscht aber nur auf IPv4, und BusyBox-wget wechselt die
# Adressfamilie nicht — die Pruefung schluege sonst faelschlich fehl.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider "http://127.0.0.1:${PORT}/" || exit 1

USER 101
CMD ["nginx", "-g", "daemon off;"]
