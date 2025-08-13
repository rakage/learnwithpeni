# Rich Text Editor Setup Guide

## Overview

The application now includes a rich text editor for TEXT modules in courses, allowing admins to create content with:

- **Text Formatting**: Bold, italic, underline, strikethrough
- **Headers**: H1, H2, H3
- **Lists**: Ordered and unordered lists
- **Links**: Clickable links that open in new tabs
- **Colors**: Text and background colors
- **Alignment**: Left, center, right, justify
- **Quotes & Code**: Blockquotes and code blocks
- **Indentation**: Multiple levels of indentation

## Components

### 1. RichTextEditor (`components/RichTextEditor.tsx`)

- Used in admin course creation and editing
- Provides a full toolbar with formatting options
- Handles link insertion and formatting
- Dynamic import to avoid SSR issues

### 2. RichTextDisplay (`components/RichTextDisplay.tsx`)

- Used to display formatted content to students
- Makes all links clickable and open in new tabs
- Preserves all formatting from the editor
- Responsive design with proper styling

## Features

### Text Formatting

- **Bold**: `**text**` or toolbar button
- **Italic**: `*text*` or toolbar button
- **Underline**: Toolbar button
- **Strikethrough**: Toolbar button

### Links

1. Select text in the editor
2. Click the link button in toolbar
3. Enter URL
4. Links automatically open in new tabs when viewed

### Headers

- H1, H2, H3 available from dropdown
- Proper hierarchy and styling

### Lists

- Bulleted lists (unordered)
- Numbered lists (ordered)
- Nested lists supported

### Colors

- Text color picker
- Background color picker
- Full color palette available

### Code

- Inline code: Backticks or toolbar
- Code blocks: Toolbar button
- Proper syntax highlighting

## Usage

### For Admins (Creating Content)

1. Go to Admin → Courses → Create/Edit Course
2. Add a "Text" module
3. Use the rich text editor with full toolbar
4. Format text as needed
5. Add links by selecting text and clicking link button
6. Save the course

### For Students (Viewing Content)

1. Enroll in course
2. Navigate to text modules
3. Content displays with proper formatting
4. Click links to open in new tabs
5. All formatting preserved

## Technical Details

### Dependencies

- `react-quill`: Rich text editor component
- `quill`: Core editor library
- Dynamic imports prevent SSR issues

### Styling

- Custom CSS for consistent design
- Tailwind integration
- Responsive layout
- Proper focus states

### Security

- Content is sanitized
- Links have `rel="noopener noreferrer"`
- XSS protection maintained

## Customization

### Toolbar Options

Edit `modules` object in `RichTextEditor.tsx`:

```javascript
const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    // Add or remove options as needed
  ],
};
```

### Styling

Modify the CSS in either component to match your design system.

## Troubleshooting

### Editor Not Loading

- Check if `react-quill` is properly installed
- Ensure dynamic import is working
- Check browser console for errors

### Links Not Clickable

- Verify `RichTextDisplay` component is used
- Check if `useEffect` hook is running
- Ensure content has proper HTML structure

### Formatting Lost

- Check if content is saved as HTML
- Verify database field can store HTML
- Ensure proper sanitization

## Best Practices

1. **Content Structure**: Use headers to organize content
2. **Links**: Always use descriptive link text
3. **Lists**: Keep items concise and parallel
4. **Colors**: Use sparingly for emphasis
5. **Code**: Format code blocks for readability

The rich text editor provides a professional content creation experience while maintaining security and performance.
