# **App Name**: MatchFlow

## Core Features:

- Secure User Authentication: Email and password registration, fast login, and secure session management for new and returning users, storing user credentials and session info in Firestore.
- Guided Profile Creation: Multi-step process for new users to fill out details including name, gender, date of birth (with 18+ validation), selection of East African countries, and 'looking for' preferences, all saved to Firestore.
- Dynamic User Discovery: Home screen displaying other registered user profiles in a two-column grid layout, retrieved from Firestore, allowing users to browse potential matches.
- Basic Instant Messaging: Core chat functionality allowing users to send and receive text messages with matches, with messages stored and retrieved from Firestore.
- Intuitive Bottom Navigation: A persistent bottom navigation bar providing quick access to 'Home', 'Chats', and 'Me' (user's own profile) screens.
- Account Management & Settings: A dedicated settings screen where users can manage their account, including options to sign out and securely delete their profile and associated data from Firestore.
- AI Conversation Starter Tool: A generative AI tool that analyzes matched user profiles to suggest personalized ice-breaker messages or relevant conversation starters to facilitate initial interactions.

## Style Guidelines:

- Primary color: A sophisticated, muted plum (#663D66) to convey depth and connection, providing a refined feel that contrasts well with the light background.
- Background color: A very light, desaturated plum (#FBF5FB) for a clean, open, and approachable base, aligning with a gentle and warm aesthetic.
- Accent color: A vibrant yet harmonious violet (#BC9DDF) used for interactive elements and highlights, adding a touch of liveliness and focus.
- Headline font: 'Belleza' (humanist sans-serif) for its elegant and artistic personality, suitable for drawing attention to profile names and key features. Body text font: 'Alegreya' (humanist serif) to complement 'Belleza', offering excellent readability for longer profile descriptions and chat messages.
- Use a set of modern, minimalist line icons for navigation elements and user actions to maintain a clean and uncluttered interface. Ensure icons are intuitive for dating app functionalities like messaging and profile viewing.
- Implement a 'two users side by side' grid layout on the home screen for efficient browsing. Utilize a clean, card-based design for user profiles and chat bubbles for clear conversation flow.
- Incorporate subtle hover and click animations for interactive elements, such as profile cards and buttons, to provide visual feedback and enhance the user experience without distraction.