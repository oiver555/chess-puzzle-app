# Chess Sandbox ♟️

Chess Sandbox is a React Native chess application built with :contentReference[oaicite:0]{index=0} and :contentReference[oaicite:1]{index=1}.

The goal of this project is to build a full-featured chess app that supports:

- Real chess piece movement
- Legal move validation using :contentReference[oaicite:2]{index=2}
- Interactive board selection and move highlighting
- SVG-based chess pieces
- Move sound effects
- Future AI opponent integration using :contentReference[oaicite:3]{index=3}
- Offline gameplay support
- Difficulty levels for AI opponents

This project started as a chessboard mockup and is being developed into a full production-ready chess application.

---

## Tech Stack

- React Native
- Expo
- TypeScript
- chess.js
- react-native-svg
- expo-audio

---

## Features Completed

- 8x8 interactive chessboard
- SVG chess piece rendering
- Piece selection
- Legal move highlighting
- Move validation
- Piece movement
- Move sound effects
- Game state handling through chess.js

---

## Project Structure

```text
components/
  ChessBoard.tsx
  Piece.tsx
  Square.tsx

logic/
  chessGame.ts

assets/
  pieces/
  sounds/

App.tsx