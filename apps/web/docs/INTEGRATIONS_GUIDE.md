# Integrations Design Pattern Guide

This document explains the scalable pattern for adding new integrations to the Orbit Dashboard.

## Architecture

The integrations system follows a **Component-Based Card Pattern** with reusable UI components.

### Directory Structure

```
app/
├── components/
│   ├── ui/                    # Reusable base components
│   │   ├── card.tsx           # Card, CardHeader, CardTitle, CardContent, CardFooter
│   │   ├── button.tsx         # Button with variants (default, outline, ghost, connected, disconnected)
│   │   └── search-input.tsx   # Search input with TUI styling
│   └── integrations/          # Integration-specific cards
│       ├── TelegramCard.tsx   # Telegram integration card
│       ├── EmailCard.tsx      # Email integration card (placeholder)
│       └── index.ts           # Barrel export
├── dashboard/
│   └── page.tsx               # Dashboard page with search bar and cards grid
└── types/
    └── integrations.ts        # Integration types
```

## Adding a New Integration

Follow these steps to add a new integration card (e.g., Discord):

### 1. Update Types

Add the integration type to `types/integrations.ts`:

```typescript
export type IntegrationType = "telegram" | "email" | "discord" | "slack";
```

### 2. Create Integration Card Component

Create `components/integrations/DiscordCard.tsx`:

```typescript
"use client";

import { FaDiscord } from "react-icons/fa";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";

export interface DiscordCardProps {
  isConnected: boolean;
  username?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  loading?: boolean;
}

export function DiscordCard({
  isConnected,
  username,
  onConnect,
  onDisconnect,
  loading = false,
}: DiscordCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-3">
            <FaDiscord className="text-lg" />
            <span>Integration::Discord</span>
            <div className="flex-1" />
            <div className={`flex items-center gap-2 text-[10px] uppercase tracking-widest ${
              isConnected ? "text-green-500/80" : "text-yellow-500/80"
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500/50"
              }`} />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs text-white/60 leading-relaxed">
          Connect your Discord account for notifications.
        </p>

        {isConnected && username && (
          <div className="border border-white/20 p-4 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaDiscord className="text-white/60" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                    Linked Account
                  </p>
                  <p className="text-sm font-bold text-white tracking-tight">
                    {username}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {!isConnected ? (
          <Button onClick={onConnect} loading={loading} className="w-full">
            Connect Discord
          </Button>
        ) : (
          <Button variant="outline" onClick={onDisconnect} loading={loading} className="w-full">
            Disconnect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

### 3. Export the Component

Update `components/integrations/index.ts`:

```typescript
export * from "./TelegramCard";
export * from "./EmailCard";
export * from "./SearchCard";
export * from "./DiscordCard";  // Add this
```

### 4. Update Dashboard

Add the card to `dashboard/page.tsx`:

```typescript
import { DiscordCard } from "../components/integrations/DiscordCard";

// In the component, add state and handlers
const [discordConnecting, setDiscordConnecting] = useState(false);

const handleConnectDiscord = () => {
  // Navigate to Discord connection page or show modal
  router.push("/connect/discord");
};

const handleDisconnectDiscord = async () => {
  // API call to disconnect Discord
};

// In the JSX, add to grid
<DiscordCard
  isConnected={!!user.discordUsername}
  username={user.discordUsername}
  onConnect={handleConnectDiscord}
  onDisconnect={handleDisconnectDiscord}
  loading={discordConnecting}
/>
```

## Component Patterns

### Card Component

Base container with TUI styling and corner decorations:

```tsx
<Card className="custom-class">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Button Component

Variants:
- `default` - White background, black text (primary action)
- `outline` - Border, white text (secondary action)
- `ghost` - Transparent, hover effect (tertiary action)
- `connected` - Green themed (connected state)
- `disconnected` - Yellow themed (disconnected state)

Sizes:
- `sm` - Small (px-3 py-1.5)
- `default` - Default (px-6 py-3)
- `lg` - Large (px-8 py-4)

### SearchInput Component

Search bar with TUI styling and search icon:

```tsx
<SearchInput
  placeholder="Search integrations..."
  onSearch={(query) => console.log(query)}
  className="w-full"
/>
```

### Adding to the Dashboard Integrations Array

To make your new integration searchable, add it to the `integrations` array in `dashboard/page.tsx`:

```typescript
const integrations = [
  {
    id: "telegram",
    name: "Telegram",
    component: (
      <TelegramCard
        key="telegram"
        isConnected={!!user.telegramUsername}
        username={user.telegramUsername}
        onConnect={handleConnectTelegram}
        onDisconnect={handleDisconnectTelegram}
        onAuthorizeDesktop={generateDesktopToken}
        loading={generatingToken}
      />
    ),
  },
  {
    id: "discord",
    name: "Discord",
    component: (
      <DiscordCard
        key="discord"
        isConnected={!!user.discordUsername}
        username={user.discordUsername}
        onConnect={handleConnectDiscord}
        onDisconnect={handleDisconnectDiscord}
        loading={discordConnecting}
      />
    ),
  },
];
```

The dashboard automatically filters integrations based on the `name` field when users type in the search bar.

## State Management

Each integration card receives props for:
- `isConnected` - Boolean connection status
- `username` - Connected account identifier
- `onConnect` - Callback for connecting
- `onDisconnect` - Callback for disconnecting
- `loading` - Loading state for async actions

## Styling Guidelines

- Use TUI theme: black background, white text, monospace font
- **Brand Colors**: Each integration should use its brand color for visual identity:
  - Telegram: `#0088cc` (blue)
  - Email/Gmail: `#EA4335` (red)
  - Search: `#4285F4` (Google blue)
  - Discord: `#5865F2` (blurple)
  - Slack: `#4A154B` (purple)
- **Color Application**:
  - Icons: Use brand color directly
  - Connected state info box: Use brand color background with opacity (`rgba(color, 0.1)`)
  - Borders: Use brand color with opacity (`rgba(color, 0.3)`)
  - Primary buttons: Use brand color background with white text
  - Secondary buttons: Use brand color border and text
  - Status indicators: Green for connected, Yellow for disconnected, Red for error
- Borders: `border-white/20` for subtle separation (default)
- Backgrounds: `bg-black/90` for cards, `bg-white/5` for inner sections
- Icons: Use `react-icons` library
- Typography: Uppercase, tracking-widest for labels

## Future Enhancements

Consider adding:
1. Integration settings modal
2. Connection history/logs
3. Integration-specific permissions management
4. Bulk disconnect functionality
5. Integration health monitoring
