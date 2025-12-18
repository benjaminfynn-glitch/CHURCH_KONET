# Excel Import Template for Church Members

## How to Create the Excel Template

1. **Open Excel** (or Google Sheets)
2. **Create a new workbook**
3. **Name the first sheet "Data"** (case-sensitive)
4. **Add these exact column headers in row 1:**

| Full Name | Gender | Date of Birth (DD/MM/YYYY) | Organization |
|-----------|--------|----------------------------|--------------|

## Sample Data

| Full Name          | Gender | Date of Birth (DD/MM/YYYY) | Organization     |
|--------------------|--------|----------------------------|------------------|
| John Doe          | Male   | 15/03/1985                | Youth Ministry  |
| Mary Smith        | Female | 22/07/1990                | Choir           |
| Peter Johnson     | Male   | 10/12/1982                | Elders Council  |

## Important Notes

- **Sheet name must be "Data"** (case-sensitive)
- **Date format must be DD/MM/YYYY** (e.g., 15/03/1985)
- **Gender should be "Male" or "Female"**
- **Organization can be any text**
- **Save as .xlsx or .xls format**

## Validation Rules

- All columns are required
- Duplicate members (same name + birth date) will be rejected
- Invalid dates will be skipped
- Empty rows will be ignored

## Usage

1. Click "Import Member" button on Members page
2. Select your Excel file
3. Preview the data
4. Click "Confirm & Save Members"