# Manual Testing Guide: Admin Apartment Creation

## Quick Start

1. **Start the dev server**:
   ```bash
   npm run dev
   ```
   Server will run at: http://localhost:5173

2. **Admin Login Credentials**:
   - Check your `.env.local` for admin user credentials
   - Or create a new admin user in Supabase dashboard

3. **Navigate to Feature**:
   - Go to http://localhost:5173/admin
   - Log in with admin credentials
   - Click the purple "דירה חדשה" button

---

## Visual Testing Checklist

### Page: Create Apartment Form (`/admin/apartments/new`)

**Header Section**:
- [ ] White background with shadow
- [ ] "← חזרה לרשימה" link (blue, top-left when viewing in RTL)
- [ ] "יצירת דירה חדשה" heading (bold, large, black text)

**Form Section**:
- [ ] White card with rounded corners and shadow
- [ ] "מספר דירה" label (right-aligned)
- [ ] Apartment number input with placeholder "לדוגמה: 42 או 10A"
- [ ] "שם בעל הדירה" label (right-aligned)
- [ ] Owner name input with placeholder "לדוגמה: משה לוי"

**Info Box**:
- [ ] Blue background box (below input fields)
- [ ] Blue info icon on the right
- [ ] Bold heading: "חשוב!"
- [ ] Warning text about one-time PIN display

**Submit Button**:
- [ ] Full-width button at bottom
- [ ] Gray/disabled when form is empty
- [ ] Blue when form is filled
- [ ] Text: "צור דירה" (or "יוצר דירה..." when loading)

**Error Display** (if applicable):
- [ ] Red background box above submit button
- [ ] Red text with error message in Hebrew

---

### Modal: PIN Display

**Success State**:
- [ ] Dark semi-transparent background overlay
- [ ] White modal centered on screen
- [ ] Green circle with checkmark icon at top
- [ ] "קוד PIN נוצר בהצלחה!" heading

**Apartment Info Box** (gray background):
- [ ] "מספר דירה:" label with apartment number
- [ ] "שם בעל הדירה:" label with owner name
- [ ] Two-column layout

**PIN Display Box** (blue background):
- [ ] Light blue background with blue border
- [ ] "קוד PIN:" small label
- [ ] 6-digit PIN in VERY LARGE font (monospace)
- [ ] PIN is selectable text

**Warning Box** (red background):
- [ ] Red/pink background with red border
- [ ] Warning triangle icon
- [ ] Bold heading: "זוהי ההזדמנות היחידה לראות את הקוד!"
- [ ] Warning text about not being able to see PIN again

**Action Buttons** (two side-by-side):
- [ ] "העתק לזיכרון" button (blue, left side)
  - [ ] Copy icon
  - [ ] Changes to "הועתק!" after clicking
- [ ] "הדפס" button (gray, right side)
  - [ ] Print icon

**Acknowledgment Section** (gray background):
- [ ] Checkbox (unchecked by default)
- [ ] Text: "העתקתי את הקוד ואני מבין/ה שלא אוכל לראות אותו שוב"

**Close Button**:
- [ ] Full-width button at bottom
- [ ] Gray/disabled when checkbox is unchecked
- [ ] Green when checkbox is checked
- [ ] Text: "סגור"

---

## Step-by-Step Test Scenarios

### Test 1: Basic Flow (Happy Path)

**Objective**: Verify complete apartment creation workflow

**Steps**:
1. Navigate to http://localhost:5173/admin
2. Log in with admin credentials
3. Click "דירה חדשה" (purple button with "+" icon)
4. Verify redirected to `/admin/apartments/new`
5. Enter apartment number: **"999"**
6. Enter owner name: **"בדיקת מערכת"**
7. Click "צור דירה"
8. Wait for modal to appear (1-2 seconds)

**Expected Visual Results**:
- Form submits without errors
- PIN modal appears over a dark background
- Modal shows:
  - Green success icon
  - Apartment number: "999"
  - Owner name: "בדיקת מערכת"
  - 6-digit PIN (e.g., "425813")
  - All warnings and buttons as listed above
  - Close button is DISABLED (gray)

**Action**: Write down the PIN shown in the modal for Test 4

---

### Test 2: Copy & Close Flow

**Objective**: Verify PIN copy and modal close functionality

**Prerequisites**: Complete Test 1

**Steps**:
1. In the PIN modal, click "העתק לזיכרון"
2. Verify button text changes to "הועתק!"
3. Open a text editor and paste (Cmd+V or Ctrl+V)
4. Verify PIN is pasted correctly
5. Return to modal
6. Click the acknowledgment checkbox
7. Verify "סגור" button changes from gray to green
8. Click "סגור"

**Expected Visual Results**:
- Copy button shows "הועתק!" temporarily
- PIN is copied to clipboard
- Checkbox can be checked
- Close button becomes green/enabled
- Modal closes
- Form is cleared (inputs are empty)
- Still on `/admin/apartments/new` page

---

### Test 3: Print Flow

**Objective**: Verify print functionality

**Prerequisites**: Complete Test 1 (or create a new apartment)

**Steps**:
1. In the PIN modal, click "הדפס"
2. Browser print dialog should open
3. In print preview, verify content shows:
   - Apartment number
   - Owner name
   - PIN number
4. Cancel print dialog (don't actually print)

**Expected Visual Results**:
- Print dialog opens
- Print preview shows apartment details
- Can cancel without closing modal

---

### Test 4: Login with Generated PIN

**Objective**: Verify the generated PIN works for resident login

**Prerequisites**: Complete Test 1 and have the PIN copied/saved

**Steps**:
1. Close the PIN modal (acknowledge and click סגור)
2. Click "התנתק" to log out from admin
3. Navigate to home page: http://localhost:5173
4. Enter apartment number: **"999"**
5. Enter the PIN from Test 1
6. Click the login button

**Expected Visual Results**:
- Login succeeds
- Either:
  - Voting screen appears (if there's an active vote)
  - "אין הצבעה פעילה כרגע" message (if no active vote)

**What This Tests**: Server-side PIN validation, bcrypt comparison, end-to-end flow

---

### Test 5: Duplicate Apartment Error

**Objective**: Verify duplicate apartment number handling

**Prerequisites**: Apartment "999" already created (from Test 1)

**Steps**:
1. Navigate to `/admin/apartments/new`
2. Enter apartment number: **"999"** (same as before)
3. Enter owner name: **"דירה כפולה"**
4. Click "צור דירה"

**Expected Visual Results**:
- Red error box appears above submit button
- Error message: "מספר דירה זה כבר קיים במערכת"
- NO modal appears
- Form stays filled with entered data
- Can edit apartment number and retry

---

### Test 6: Empty Field Validation

**Objective**: Verify client-side form validation

**Steps**:
1. Navigate to `/admin/apartments/new`
2. Leave both fields empty
3. Check submit button state (should be disabled)
4. Enter apartment number: "888"
5. Check submit button state (should still be disabled)
6. Clear apartment number
7. Enter owner name: "בעל דירה"
8. Check submit button state (should still be disabled)
9. Enter apartment number: "888"
10. Check submit button state (should now be enabled)

**Expected Visual Results**:
- Submit button is gray/disabled when either field is empty
- Submit button is blue/enabled only when BOTH fields are filled
- Hover effect works only when enabled

---

### Test 7: Keyboard Navigation (Accessibility)

**Objective**: Verify keyboard-only navigation

**Steps**:
1. Navigate to `/admin/apartments/new`
2. Press **Tab** - focus should move to apartment number field
3. Type "777"
4. Press **Tab** - focus should move to owner name field
5. Type "בדיקת נגישות"
6. Press **Tab** - focus should move to submit button
7. Press **Enter** - form should submit
8. In PIN modal:
   - Press **Tab** repeatedly to navigate through elements
   - Verify you can reach copy button, print button, checkbox, close button
   - Checkbox should be toggleable with **Space** key
   - Close button should be activatable with **Enter** key

**Expected Visual Results**:
- Focus indicators are visible (blue outline around focused element)
- Tab order is logical (top to bottom, right to left in RTL)
- Form can be submitted with Enter key
- Modal traps focus (cannot tab to elements behind modal)

---

### Test 8: Modal Cannot Close Without Acknowledgment

**Objective**: Verify forced acknowledgment security feature

**Prerequisites**: Create any apartment to open PIN modal

**Steps**:
1. In PIN modal, ensure checkbox is UNCHECKED
2. Click directly on the dark background outside the modal
3. Verify modal does NOT close
4. Press **Escape** key
5. Verify modal does NOT close
6. Try clicking "סגור" button
7. Verify button is disabled and does nothing

**Expected Visual Results**:
- Modal remains open when clicking outside
- Escape key does not close modal
- Close button is disabled and cannot be clicked
- User is forced to check acknowledgment to proceed

---

### Test 9: RTL and Hebrew Text

**Objective**: Verify right-to-left layout and Hebrew language

**Visual Checks**:
- [ ] All labels are in Hebrew
- [ ] Text flows right-to-left
- [ ] Input text aligns to the right
- [ ] Buttons have Hebrew text
- [ ] Icons are positioned correctly for RTL (e.g., back arrow points right)
- [ ] Modal content flows right-to-left
- [ ] No text is cut off or overlapping

**Browser Developer Tools Check**:
- Inspect the main div - should have `dir="rtl"` attribute
- All Hebrew text should be grammatically correct

---

### Test 10: Loading State

**Objective**: Verify visual feedback during submission

**Steps**:
1. Navigate to `/admin/apartments/new`
2. Fill in fields:
   - Apartment: "666"
   - Owner: "בדיקת טעינה"
3. Click "צור דירה"
4. **Quickly observe** the button state during submission

**Expected Visual Results**:
- Button text changes to "יוצר דירה..." (with ellipsis)
- Button becomes disabled during submission
- Input fields become disabled
- Cannot click submit again while loading
- Loading state lasts 1-2 seconds (fast network) or longer (slow network)

**Tip**: If submission is too fast to see loading state, you can simulate slow network in Chrome DevTools (Network tab > Throttling > Slow 3G)

---

### Test 11: Responsive Design (Mobile)

**Objective**: Verify feature works on mobile viewport

**Steps**:
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)
3. Select iPhone or Android device
4. Navigate through the create apartment flow

**Expected Visual Results**:
- Form is responsive and fits mobile screen
- Text is readable (not too small)
- Buttons are large enough to tap
- Modal fits mobile screen without scrolling
- PIN is visible without zooming
- All interactions work with touch

---

## Visual Regression Checklist

Use this checklist to verify visual consistency:

**Form Page**:
- [ ] Header shadow is subtle and professional
- [ ] Form card has rounded corners (8px radius)
- [ ] Input fields have blue focus state
- [ ] Blue info box has info icon on the right (RTL)
- [ ] Submit button has smooth color transition on hover
- [ ] Colors match design system (blue-600 for primary actions)

**PIN Modal**:
- [ ] Modal is centered on screen
- [ ] Modal has shadow/elevation effect
- [ ] Green success icon is well-sized (not too big/small)
- [ ] PIN font is large and monospace (easy to read)
- [ ] Warning icon matches the red color scheme
- [ ] Buttons have icons aligned with text
- [ ] Checkbox is properly styled and easy to click

**Overall**:
- [ ] No visual glitches or flickering
- [ ] Animations are smooth (if any)
- [ ] Colors have sufficient contrast (accessibility)
- [ ] All Hebrew text uses correct font

---

## Browser Compatibility Testing

Test the feature on multiple browsers:

- [ ] **Chrome** (latest version)
- [ ] **Firefox** (latest version)
- [ ] **Safari** (if on macOS)
- [ ] **Edge** (latest version)

**What to verify**:
- Copy to clipboard works on all browsers
- Print dialog works on all browsers
- Modal styling is consistent
- RTL layout is correct
- No console errors

---

## Database Verification

After testing, verify data in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Open `apartments` table
4. Find the apartments you created (999, 888, 777, etc.)
5. Verify:
   - [ ] Apartment numbers are stored correctly
   - [ ] Owner names are stored correctly
   - [ ] `pin_hash` column contains bcrypt hash (starts with "$2")
   - [ ] NO plaintext PINs are stored anywhere

**Security Check**: Run this SQL query in SQL Editor:
```sql
SELECT number, pin_hash, LEFT(pin_hash, 3) as hash_prefix
FROM apartments
WHERE number IN ('999', '888', '777');
```

Expected result: `hash_prefix` should be "$2a" or "$2b" (bcrypt format)

---

## Troubleshooting

### Issue: Modal doesn't appear after creating apartment
- **Check**: Browser console for errors
- **Verify**: Admin user is authenticated
- **Try**: Refresh page and try again

### Issue: Copy button doesn't work
- **Check**: Browser permissions for clipboard access
- **Verify**: Using HTTPS or localhost (clipboard API requirement)
- **Try**: Use a different browser

### Issue: Login with generated PIN fails
- **Check**: PIN was copied correctly (no extra spaces)
- **Verify**: Apartment number matches exactly
- **Try**: Create a new apartment and try with that PIN

### Issue: Duplicate apartment error doesn't show
- **Check**: Apartment with that number already exists in database
- **Verify**: Using the exact same apartment number
- **Try**: Delete the duplicate apartment from Supabase and retry

---

## Test Data Cleanup

After testing, you may want to clean up test apartments:

**Option 1: Via Supabase Dashboard**
1. Go to Supabase Table Editor
2. Open `apartments` table
3. Find test apartments (999, 888, 777, 666)
4. Delete rows manually

**Option 2: Via SQL**
```sql
DELETE FROM apartments
WHERE number IN ('999', '888', '777', '666');
```

**Note**: This will also delete associated votes and audit logs due to CASCADE constraints.

---

## Acceptance Criteria

Feature is ready for production when:

- [ ] All 13 test scenarios pass
- [ ] Visual regression checklist completed
- [ ] Browser compatibility verified on 3+ browsers
- [ ] Keyboard navigation works correctly
- [ ] Mobile viewport is functional
- [ ] Database verification shows correct data
- [ ] No console errors during testing
- [ ] Audit logs are created in database
- [ ] PIN login works end-to-end

---

## Estimated Testing Time

- **Quick smoke test**: 10-15 minutes (Tests 1-4)
- **Comprehensive testing**: 30-45 minutes (All tests)
- **Full regression with multiple browsers**: 60-90 minutes

---

**Last Updated**: 2025-12-23
**Document Version**: 1.0
