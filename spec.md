# SD Corp

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add

**Authentication & Security**
- User registration with Name, Email, User ID, Password
- Login with email/user ID and password
- 4-digit PIN lock screen required after login (stored per user)
- Change password and change PIN from profile
- Logout

**Dashboard**
- Summary cards: Total Active Sites, Total Payment Received, Total Payment Given, Profit/Loss
- Recent Transactions list (latest 10 across all sites)

**Site Management**
- Create, view, and list construction sites
- Site fields: Site Name, Client Name, Location, Start Date, Total Project Amount
- Site detail/dashboard view showing site-level financial summary and transactions

**Transactions**
- Add transactions to a site: Payment Received, Material Purchase, Labour Payment, Misc Expense
- Transaction fields: Type, Date, Amount, Notes, Payment Mode (Cash/Cheque/Bank Transfer/UPI)
- List and filter transactions per site

**Labour Management**
- Add and manage labourers per site: Name, Phone Number, Work Type, Daily Wage
- Track payment history per labourer

**Profile Section**
- View and edit profile (Name, Email, User ID)
- Change password
- Change 4-digit PIN
- Logout

**UI**
- Mobile-first responsive layout (optimized for Android 10+)
- Light Mode and Dark Mode toggle

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan

**Backend (Motoko)**
1. User entity: id, name, email, userId, passwordHash, pinHash, createdAt
2. Site entity: id, ownerId, siteName, clientName, location, startDate, totalProjectAmount, isActive
3. Transaction entity: id, siteId, type, date, amount, notes, paymentMode
4. Labour entity: id, siteId, name, phone, workType, dailyWage
5. LabourPayment entity: id, labourId, date, amount, notes
6. CRUD APIs: createUser, login, updatePin, updatePassword, getSites, createSite, getSiteById, createTransaction, getTransactionsBySite, createLabour, getLabourBySite, addLabourPayment, getDashboardStats

**Frontend**
1. Auth flow: Login screen, Register screen, PIN lock screen
2. Bottom tab navigation: Dashboard, Sites, Transactions (global), Labour, Profile
3. Dashboard screen with stat cards and recent transactions
4. Sites list + Create Site form + Site detail dashboard
5. Add Transaction sheet/modal (per site)
6. Labour list per site + Add Labour form + Payment history modal
7. Profile screen with change password, change PIN dialogs
8. Dark/light mode toggle persisted in local storage
