# TaskFlow — Make today count

A polished, responsive to-do list built with **HTML, CSS, and vanilla JavaScript**. No framework, build step, or package installation required.

## Features

- Create tasks with a category, priority, and optional due date
- Mark tasks complete or move them back to in progress
- Edit and delete individual tasks
- Filter by all tasks, today, upcoming, and completed
- Filter by completion status and search task titles/categories/priorities
- Sort by recently added, due date, priority, or alphabetically
- Dashboard statistics and a completion progress indicator
- Overdue and due-today/tomorrow labels
- Responsive layout for desktop, tablet, and mobile
- Saves tasks in browser `localStorage` so they remain after refresh
- Accessible labels, keyboard-friendly forms, and safe text rendering

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Add a task — your list is saved in that browser on that device.

For a smoother development workflow, use the **Live Server** extension in VS Code and open `index.html` with it.

## Publish with GitHub Pages

1. Create a new GitHub repository, for example `taskflow-todo`.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site; the URL will appear in the Pages settings.

## Project structure

```text
taskflow-todo/
├── index.html   # Page structure and form controls
├── styles.css   # Responsive design and visual styling
├── app.js       # Task logic, filters, sorting, and local storage
└── README.md    # Setup and publishing instructions
```

## Notes

- Tasks are stored locally in the browser. They are not synced between devices or shared between users.
- Clearing browser site data may remove saved tasks.
- Google Fonts are loaded from the web; the page still works if the font service is unavailable, using fallback fonts.

## License

MIT — feel free to use, modify, and learn from this project.
