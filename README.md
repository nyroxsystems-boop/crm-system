# 🗄️ AutoTeile CRM System

Vollständiges CRM-System für die AutoTeile WAWI-Lösung mit SQLite-Datenbank.

## 📊 Features

- **SQLite Datenbank** - Leichtgewichtige, dateibasierte Datenbank
- **Bestellverwaltung** - Vollständige Order-Management
- **Benutzerverwaltung** - User Authentication & Authorization
- **Nachrichten-System** - Chat-Historie mit Kunden
- **Angebots-Management** - Shop-Angebote und Preise
- **Händler-Einstellungen** - Konfigurierbare Merchant-Settings

## 🗃️ Datenbank-Schema

### Tabellen:

#### **orders**
- Bestellungen mit Status-Tracking
- Fahrzeugdaten (VIN, HSN/TSN, Marke, Modell)
- Teileinformationen
- OEM-Nummern
- Scraping-Ergebnisse

#### **messages**
- Chat-Nachrichten (eingehend/ausgehend)
- Verknüpfung mit Bestellungen
- Zeitstempel

#### **shop_offers**
- Angebote von verschiedenen Shops
- Preise und Verfügbarkeit
- Lieferzeiten
- Margen-Berechnung

#### **users**
- Benutzer-Accounts
- Rollen (admin, dealer, staff)
- Passwort-Hashing (SHA-256)
- Session-Management

#### **sessions**
- Aktive Benutzer-Sessions
- Token-basierte Authentifizierung
- Ablaufdatum

#### **merchant_settings**
- Händler-Konfiguration
- Ausgewählte Shops
- Marge-Prozentsatz
- Sprach-Einstellungen

## 🚀 Setup

### Voraussetzungen:
- Node.js 18+
- SQLite3

### Installation:

```bash
# Repository klonen
git clone https://github.com/nyroxsystems-boop/Autoteile-CRM.git
cd Autoteile-CRM

# Datenbank initialisieren
npm install
npm run init-db

# Demo-Daten generieren (optional)
npm run generate-demo-data
```

## 📝 SQL-Schema

Alle SQL-Dateien befinden sich im `db/` Verzeichnis:

- `orders.sql` - Bestellungen-Tabelle
- `messages.sql` - Nachrichten-Tabelle
- `shop_offers.sql` - Angebote-Tabelle
- `users.sql` - Benutzer-Tabelle
- `sessions.sql` - Sessions-Tabelle
- `merchant_settings.sql` - Händler-Einstellungen

## 🔧 Verwendung

### Mit Bot-Service:

```javascript
import * as db from './database';

// Datenbank initialisieren
await db.initDb();

// Bestellung erstellen
const order = await db.run(
  'INSERT INTO orders (id, status, ...) VALUES (?, ?, ...)',
  [orderId, 'pending', ...]
);

// Bestellungen abrufen
const orders = await db.all('SELECT * FROM orders WHERE status = ?', ['pending']);
```

### Standalone:

```bash
# SQLite CLI öffnen
sqlite3 crm.db

# Bestellungen anzeigen
SELECT * FROM orders;

# Benutzer anzeigen
SELECT * FROM users;
```

## 📊 Demo-Daten

Das System enthält einen Demo-Daten-Generator:

```bash
npm run generate-demo-data
```

Generiert:
- 50 realistische Bestellungen
- 239 Chat-Nachrichten
- 56 Shop-Angebote
- 3 Demo-Benutzer
- Händler-Einstellungen

## 🔒 Sicherheit

- ✅ Passwort-Hashing (SHA-256)
- ✅ Session-basierte Authentifizierung
- ✅ SQL-Injection-Schutz durch Prepared Statements
- ✅ Input-Validierung

## 🧪 Tests

```bash
# Datenbank-Tests
npm run test:db

# Integrations-Tests
npm run test:integration
```

## 📖 API-Integration

Das CRM-System wird vom Bot-Service verwendet:

```
Bot-Service → database.ts → SQLite CRM
```

Alle Datenbankoperationen laufen über das `database.ts` Modul.

## 🔗 Verwandte Repositories

- [Autoteile-bot-service](https://github.com/nyroxsystems-boop/Autoteile-bot-service) - Backend API
- [Autoteile-Dashboard](https://github.com/nyroxsystems-boop/Autoteile-Dashboard) - Frontend Dashboard

## 📄 Lizenz

Proprietary - Alle Rechte vorbehalten

## 👥 Kontakt

Nyrox Systems - https://github.com/nyroxsystems-boop
