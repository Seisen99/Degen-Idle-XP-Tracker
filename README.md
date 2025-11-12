# Degen Idle XP Tracker & Optimizer

## What it does

Tracks your XP progression in real-time while you play Degen Idle. Shows estimated time to reach your next level and calculates how long it takes to hit specific level goals. Now includes an **XP Optimizer** that finds the most efficient crafting path to level up!

## Features

### XP Tracker
- Live XP tracking for active tasks with real-time countdown
- Time estimates for next level
- Custom target level calculator
- Crafting requirements checker with material inventory
- Preview mode - click any resource to see XP rates before starting

### XP Optimizer (NEW in v2.0!)
- **Calculates optimal crafting paths** to reach your target level
- Analyzes all craftable items and their requirements
- Finds the most XP-efficient route automatically
- Smart caching system - click on items once to build your crafting database
- Step-by-step wizard guides you through the process
- Supports complex crafting chains (bars, leather, cloth, weapons, armor)
- Real-time XP calculations based on your current level

### UI & Usability
- Draggable, resizable panels that stay out of your way
- Mobile-friendly responsive design
- Column layout for wide screens
- Persistent settings per character

## How to use

### XP Tracker
Once installed, click the "XP Tracker" button in the navbar. The panel shows your current task progress and updates automatically. Click on any resource to preview XP rates before starting a task.

Enter a target level in any card and hit "Calc" to see exactly how many actions and how much time you need to reach it.

### XP Optimizer
1. Click the **"Optimizer"** button in the XP Tracker panel
2. Select your skill (Forging, Leatherworking, Tailoring, etc.)
3. Enter your target level
4. Click on the final item you want to craft (the wizard will guide you)
5. If needed, click on required materials (bars, leather, cloth, etc.)
6. The optimizer calculates the most efficient path and shows:
   - Total XP gain
   - Total actions needed
   - Total time required
   - Step-by-step crafting instructions
   - Material requirements breakdown

**Pro tip:** The more items you click on, the better the optimizer becomes! It caches all item data so you only need to click each item once.

## Notes

Works best when you're actively doing tasks. The tracker pulls data from the game's API, so there's no manual input needed.

The optimizer cache is saved per character - switching characters will automatically load the correct cache.

If you run into issues or have suggestions, feel free to leave feedback.

## Installation

Install via [GreasyFork](https://greasyfork.org/) (recommended) or directly from the repository.

## License

MIT
