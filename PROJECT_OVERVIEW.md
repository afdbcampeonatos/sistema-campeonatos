# PROJECT OVERVIEW: SoccerFlow (Internal Name)

## 1. Product Vision

We are building a **high-performance SaaS** for soccer schools and championship organizers. The market is full of ugly, spreadsheet-like software. Our goal is to build the "Linear/Stripe" of soccer management—fast, beautiful, and engaging.

**Core Philosophy:** "The game doesn't end at the whistle."
We extend the experience with viral player cards, live match tracking for parents, and automated WhatsApp updates.

## 2. Key User Personas

1.  **The Organizer (Admin):** Needs to manage 500+ kids, payments, and brackets with zero friction.
2.  **The Referee (Mobile User):** Needs a "big button" interface to record goals/cards instantly on the pitch under sunlight.
3.  **The Parent/Player (Consumer):** Wants to see stats, tables, and shareable "Player Cards" on Instagram.

## 3. The "Unique" Factors (UVP)

- **The Viral Loop:** When a player registers, generate a dynamic "FIFA Ultimate Team" style card image for social sharing.
- **Real-Time Anxiety:** "Live Mode" for matches. When a goal is logged, the public page updates instantly (Optimistic UI).
- **Multi-Tenant Isolation:** School A cannot see School B's data.

## 4. Primary User Flows

1.  **Onboarding:** Organizer creates an account -> Sets up a Championship -> Generates a "Magic Link".
2.  **Registration:** Parent clicks link -> Fills data -> System generates "Player Card" image -> Parent shares image.
3.  **The Match:** Referee opens "Match Runner" on mobile -> Tap "Start" -> Tap "Goal (Player X)" -> Game Ends -> Table updates automatically.
