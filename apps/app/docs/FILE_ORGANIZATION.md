# File Organization Structure

This document outlines the organized file structure for the Remonta NDIS platform, designed to support multiple user types (Workers, Clients, Coordinators) with reusable components.

## 📁 Directory Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── worker/                    # Worker-specific pages
│   │   │   ├── page.tsx               # Worker dashboard home
│   │   │   ├── account/               # Worker account setup pages
│   │   │   │   ├── name/
│   │   │   │   │   └── page.tsx       # Edit name (firstName, middleName, lastName)
│   │   │   │   ├── photo/
│   │   │   │   │   └── page.tsx       # Upload profile photo
│   │   │   │   ├── bio/
│   │   │   │   │   └── page.tsx       # Edit bio/introduction
│   │   │   │   ├── personal-info/
│   │   │   │   │   └── page.tsx       # Additional personal info
│   │   │   │   ├── address/
│   │   │   │   │   └── page.tsx       # Location/address details
│   │   │   │   ├── abn/
│   │   │   │   │   └── page.tsx       # ABN information
│   │   │   │   └── emergency-contact/
│   │   │   │       └── page.tsx       # Emergency contact details
│   │   │   ├── services/              # Worker services pages
│   │   │   │   ├── offer/
│   │   │   │   │   └── page.tsx       # Services you offer
│   │   │   │   └── training/
│   │   │   │       └── page.tsx       # Additional training
│   │   │   └── training/              # Mandatory training pages
│   │   │       ├── infection-control/
│   │   │       │   └── page.tsx       # Infection control training
│   │   │       └── professional-responsibility/
│   │   │           └── page.tsx       # Professional responsibility training
│   │   ├── client/                    # Client-specific pages (future)
│   │   │   ├── page.tsx               # Client dashboard home
│   │   │   ├── account/               # Client account pages
│   │   │   └── ...                    # Other client pages
│   │   └── coordinator/               # Coordinator-specific pages (future)
│   │       ├── page.tsx               # Coordinator dashboard home
│   │       ├── account/               # Coordinator account pages
│   │       └── ...                    # Other coordinator pages
│   ├── api/
│   │   └── worker/                    # Worker-specific API routes
│   │       └── profile/
│   │           ├── [userId]/
│   │           │   └── route.ts       # GET worker profile
│   │           └── update-name/
│   │               └── route.ts       # POST update worker name
│   └── styles/
│       └── dashboard.css              # Global dashboard styles
│
├── components/
│   ├── dashboard/                     # Dashboard layout components
│   │   ├── DashboardLayout.tsx        # Main layout wrapper
│   │   ├── Sidebar.tsx                # Left navigation sidebar
│   │   ├── ProfileCard.tsx            # Right sidebar profile card
│   │   └── SimpleDashboardHeader.tsx  # Top header with logo & logout
│   └── forms/                         # Reusable form components
│       └── fields/                    # Individual field components
│           ├── index.ts               # Barrel export for easy imports
│           ├── TextField.tsx          # Text input field
│           ├── NumberField.tsx        # Number input field
│           ├── TextArea.tsx           # Textarea field
│           ├── RadioGroup.tsx         # Radio button group
│           └── SelectField.tsx        # Dropdown select field
│
└── lib/
    ├── prisma.ts                      # Prisma client instances
    └── auth.ts                        # NextAuth configuration
```

## 🎯 Design Principles

### 1. **Multi-User Type Support**
- Each user type (Worker, Client, Coordinator) has its own dashboard directory
- Shared components are reusable across all user types
- User-specific logic is isolated in their respective directories

### 2. **Reusable Components**
All form field components are stored in `src/components/forms/fields/`:
- ✅ Consistent UI/UX across all pages
- ✅ Centralized validation and error handling
- ✅ Easy to maintain and update
- ✅ Accessible (ARIA labels, error messages)

### 3. **Account Setup Pages Structure**
Each account detail page follows this pattern:
```
dashboard/[userType]/account/[section]/page.tsx
```

Example for workers:
- `/dashboard/worker/account/name` - Edit name
- `/dashboard/worker/account/photo` - Upload photo
- `/dashboard/worker/account/bio` - Edit bio

This makes it easy to:
- Add new sections for any user type
- Maintain consistent routing patterns
- Organize verification workflows

### 4. **API Route Organization**
```
api/[userType]/[resource]/[action]/route.ts
```

Example:
- `api/worker/profile/[userId]/route.ts` - GET profile
- `api/worker/profile/update-name/route.ts` - POST update name

Benefits:
- Clear separation of concerns
- Easy to find related endpoints
- Scalable for multiple user types

## 📦 Reusable Form Components

### Importing Components
```typescript
import { TextField, NumberField, RadioGroup } from '@/components/forms/fields'
```

### Usage Examples

#### TextField
```tsx
<TextField
  label="First name"
  name="firstName"
  value={formData.firstName}
  onChange={handleChange}
  required
/>
```

#### TextField (Optional)
```tsx
<TextField
  label="Middle name"
  name="middleName"
  value={formData.middleName}
  onChange={handleChange}
  isOptional
/>
```

#### NumberField
```tsx
<NumberField
  label="Age"
  name="age"
  value={formData.age}
  onChange={handleChange}
  min={18}
  max={100}
/>
```

#### TextArea
```tsx
<TextArea
  label="Your bio"
  name="bio"
  value={formData.bio}
  onChange={handleChange}
  rows={6}
  helperText="Tell us about yourself"
/>
```

#### RadioGroup
```tsx
<RadioGroup
  label="Is this your legal name?"
  name="isLegalName"
  options={[
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ]}
  value={formData.isLegalName}
  onChange={(value) => setFormData({ ...formData, isLegalName: value })}
/>
```

#### SelectField
```tsx
<SelectField
  label="Gender"
  name="gender"
  options={[
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
  ]}
  value={formData.gender}
  onChange={handleChange}
/>
```

## 🎨 Styling Convention

### CSS Classes
All form components use consistent CSS classes from `dashboard.css`:

- `.form-group` - Field wrapper
- `.form-label` - Field label
- `.form-input` - Text/number inputs
- `.form-textarea` - Textarea
- `.form-select` - Select dropdown
- `.radio-group` - Radio button group
- `.radio-label` - Radio label wrapper
- `.form-input-error` - Error state
- `.field-error-text` - Error message
- `.field-helper-text` - Helper text
- `.label-optional` - Optional field indicator

### Brand Colors
```css
--brand-primary: #0C1628   /* Dark blue */
--brand-secondary: #A3DEDE /* Teal */
--brand-accent: #FF6B35    /* Orange */
```

## 🔒 Layout Configuration

### Hide Profile Card on Account Setup Pages
```tsx
<DashboardLayout showProfileCard={false}>
  {/* Your form content */}
</DashboardLayout>
```

This automatically:
- Hides the right sidebar
- Adjusts grid layout to 2 columns (sidebar + content)
- Gives more space for forms

### Show Profile Card on Dashboard Pages
```tsx
<DashboardLayout showProfileCard={true}>
  {/* Dashboard content */}
</DashboardLayout>
```

Default behavior:
- 3-column layout (sidebar + content + profile card)
- Profile card visible on right

## 📝 Adding New User Types

To add a new user type (e.g., "Admin"):

1. **Create dashboard directory:**
   ```
   src/app/dashboard/admin/
   ```

2. **Add account pages:**
   ```
   src/app/dashboard/admin/account/name/page.tsx
   src/app/dashboard/admin/account/...
   ```

3. **Create API routes:**
   ```
   src/app/api/admin/profile/[userId]/route.ts
   ```

4. **Update Sidebar:**
   - Add Admin role to sidebar navigation
   - Create role-based menu items

5. **Reuse form components:**
   - Import from `@/components/forms/fields`
   - No need to create new field components!

## ✅ Benefits of This Structure

1. **Scalability** - Easy to add new user types and pages
2. **Maintainability** - Reusable components reduce code duplication
3. **Consistency** - All forms use same UI components
4. **Accessibility** - Form fields have proper ARIA labels
5. **Developer Experience** - Clear file organization, easy to navigate
6. **Production Ready** - Follows Next.js App Router best practices

## 🚀 Next Steps

When implementing new account pages:

1. Create page in appropriate directory
2. Import reusable form components
3. Use `showProfileCard={false}` in DashboardLayout
4. Follow existing naming conventions
5. Add API endpoint if needed
6. Update sidebar navigation

---

**Last Updated:** 2025-10-24
**Maintained By:** Remonta Development Team
