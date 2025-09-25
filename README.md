# AttendEase React Version

A React-based attendance calculator application converted from vanilla JavaScript while maintaining all original functionality and Tailwind CSS styling.

## Features

- **Subject Management**: Add, edit, and delete subjects
- **Attendance Calculation**: Calculate attendance percentage and required sessions
- **Drag & Drop**: Reorder subjects in the table
- **PDF Generation**: Generate detailed attendance reports
- **Local Storage**: Persist data across sessions
- **Responsive Design**: Works on all device sizes

## Original Features Preserved

✅ All form validation logic  
✅ Attendance percentage calculations  
✅ PDF generation with identical format  
✅ Drag-and-drop table reordering  
✅ Local storage persistence  
✅ Edit/delete functionality  
✅ Responsive Tailwind CSS styling  
✅ Icon integration (RemixIcon)  

## Technologies Used

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **jsPDF**: PDF generation
- **jsPDF-AutoTable**: Table generation in PDFs
- **React-SortableJS**: Drag-and-drop functionality
- **RemixIcon**: Icon library

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── App.jsx          # Main application component
├── main.jsx         # React entry point
└── index.css        # Global styles with Tailwind

public/
└── index.html       # HTML template

package.json         # Dependencies and scripts
vite.config.js       # Vite configuration
tailwind.config.js   # Tailwind CSS configuration
postcss.config.js    # PostCSS configuration
```

## Key React Improvements

1. **Component-Based Architecture**: Organized code in reusable React components
2. **State Management**: Used React hooks (useState, useEffect) for reactive state
3. **Modern JavaScript**: Leveraged ES6+ features and React best practices
4. **Type Safety Ready**: Structure supports easy TypeScript integration
5. **Hot Module Replacement**: Instant updates during development
6. **Optimized Builds**: Vite provides fast, optimized production builds

## Functionality Comparison

| Feature | Original | React Version |
|---------|----------|---------------|
| Form validation | ✅ | ✅ |
| Subject CRUD operations | ✅ | ✅ |
| Attendance calculations | ✅ | ✅ |
| PDF generation | ✅ | ✅ |
| Drag & drop reordering | ✅ | ✅ |
| Local storage | ✅ | ✅ |
| Responsive design | ✅ | ✅ |
| Dark theme | ✅ | ✅ |

## Development Notes

- All original calculations and validations are preserved
- localStorage integration works identically to the original
- PDF output format matches the original exactly
- All Tailwind classes and custom CSS are maintained
- Component structure allows for easy future enhancements

## License

MIT