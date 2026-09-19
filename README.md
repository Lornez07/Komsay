# 🏛️ Interactive 3D Classmates Gallery & Graduation Hall

An immersive, interactive 3D virtual museum exhibition featuring your classmates with their pictures, roles, memorable quotes, ambitions, and memories.

Built with **Three.js**, **Vite**, **HTML5 Canvas**, and **Tween.js**.

---

## 🚀 Quick Start

1. **Install dependencies** (already installed):
   ```bash
   npm install
   ```

2. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🖼️ How to Add or Change Classmate Photos & Details

### 1. Adding Photos
- Copy your classmates' photo files (e.g. `john.jpg`, `sarah.png`) into the [`public/classmates/`](file:///c:/AllaboutProgrammingHere/Komsay/public/classmates/) folder.
- If you don't have a photo yet, the gallery will automatically generate an artistic canvas portrait with their initials and accent color!

### 2. Updating Classmate Information
Open [`src/data/classmates.js`](file:///c:/AllaboutProgrammingHere/Komsay/src/data/classmates.js). You will find the classmates roster:

```javascript
{
  id: "alex-rivera",
  name: "Alex Rivera",
  nickname: "The Architect",
  role: "Class President",
  quote: "Code is like humor. When you have to explain it, it's bad.",
  memory: "Staying up until 4 AM fixing merge conflicts before defense.",
  ambition: "Lead Systems Architect & Tech Entrepreneur",
  image: "/classmates/alex.jpg", // <--- point to your image in public/classmates/
  wall: "north",                 // 'north', 'south', 'east', or 'west'
  color: "#6366f1"
}
```

---

## 🎮 Controls & Features

| Control | Action |
| :--- | :--- |
| **W, A, S, D** or **Arrow Keys** | Walk forward, left, backward, right |
| **Mouse Click & Drag** | Look around the 3D gallery |
| **Click on any Portrait Frame** | Smoothly glide up to the painting & open their showcase card |
| **Class Roster (👥)** | Search and jump directly to any classmate |
| **Museum Mini-Map** | Live radar showing your position, vision cone, and portraits |
| **Virtual Tour (🏛️)** | Sit back and enjoy an automatic guided tour of all classmates |
| **🎉 Send Cheers** | Toss golden confetti inside the inspection modal |
| **Ambience (🔇/🔊)** | Peaceful harmonic gallery soundscape synthesized via Web Audio |
| **Center View (🔄)** | Return to the center of the hall |
