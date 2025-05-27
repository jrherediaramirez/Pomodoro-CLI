Pomodoro CLI
A beautiful terminal-style Pomodoro timer built with React and Next.js. Features a retro terminal interface with full CLI command support.
Features

🍅 Pomodoro Timer: Customizable work and break intervals
💻 Terminal Interface: Authentic command-line experience
🎨 Dracula Theme: Beautiful dark theme with syntax highlighting
📊 Statistics: Track your daily productivity
🔊 Sound Notifications: Optional completion sounds
💾 Session Persistence: Your settings and progress are saved
📝 Commit Messages: Log what you accomplished during sessions

Available Commands
bash/play              # Start or resume the timer
/pause             # Pause the current timer
/reset             # Reset the current timer segment
/complete          # Manually complete the current session early
/commit "message"  # Log a message for the current session
/session "name"    # Set a name for the current focus session
/set [work|break|long] <minutes>  # Set durations
/theme [light|dark]  # Switch color theme
/sound [on|off]    # Toggle completion sound
/stats             # Show current statistics
/clear             # Clear terminal output
/help              # Show help message
Getting Started

Clone the repository

bashgit clone https://github.com/YOUR_USERNAME/pomodoro-cli.git
cd pomodoro-cli

Install dependencies

bashnpm install

Run the development server

bashnpm run dev

Open http://localhost:3000 in your browser

Usage Examples
bash# Start a 25-minute focus session
/session "Learning React"
/play

# Take a break when done
/complete
/session "Coffee break"
/set break 5
/play

# Log what you accomplished
/commit "Completed the user authentication module"

# Check your progress
/stats
Tech Stack

React - UI framework
Next.js - React framework
CSS Variables - Theming system
localStorage - Data persistence

Contributing

Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

License
This project is open source and available under the MIT License.