# PRD --- Personal Expense Management Website

## 1. Background and Objectives

### a. Product Purpose

Provide a single-user, responsive website for recording, managing,
filtering, analyzing, and exporting personal expenses across mobile and
desktop devices.

### b. Problem Statement

Users need a convenient way to maintain a structured record of personal
expenses, review spending by date and category, analyze spending
patterns, and export their records. The information must remain
available across the user's devices rather than being isolated in one
browser.

### c. Proposed Solution

Build an English-language, responsive expense management website with
four main pages: Home, Filters, Reports, and About. Users can register
and authenticate with one account, manage expenses and categories,
create and reuse custom filters, view currency-aware reports, and
download CSV or PDF exports. Expense and configuration data will be
stored centrally so the same account can access shared data from mobile
and desktop devices.

## 2. Target Audience and User Needs

### a. User Personas

-   **Primary user --- Individual expense manager:** A single person who
    wants to record and review personal expenses using a mobile phone or
    desktop browser. The user needs a straightforward interface for
    maintaining expenses, filtering records, understanding spending
    patterns, and exporting data.

The current product scope is for one account owner per account, not
shared household or team expense management.

### b. User Stories

-   As an individual user, I want to register an account so that I can
    securely access my expense data.
-   As a returning user, I want to log in with the same credentials on
    different devices so that I can access my shared expense records.
-   As a user, I want to add, edit, view, and delete expenses so that I
    can keep my records accurate.
-   As a user, I want to assign a category and currency to each expense
    so that my records are organized and correctly identified.
-   As a user, I want to manage expense categories so that the available
    categories reflect my needs.
-   As a user, I want to filter expenses by date and amount so that I
    can find relevant records.
-   As a user, I want to combine a date range with a description keyword
    and save the filter so that I can reuse common searches.
-   As a user, I want to sort and progressively load expense records so
    that large lists remain manageable.
-   As a user, I want to view charts for a selected currency and
    reporting period so that I can understand my spending without mixing
    currencies.
-   As a user, I want to export all expenses or only filtered expenses
    to CSV or PDF so that I can use or retain my records outside the
    website.
-   As a user, I want to change or recover my password so that I can
    maintain access to my account.
-   As a user, I want to read information about the application and its
    developer so that I can understand who created it.

## 3. User Flows and Experience

### a. User Journey

1.  The user opens the website on a supported mobile or desktop browser.
2.  On first use, the user registers with a username and password and
    selects a predefined security question, then provides its answer.
3.  On later visits or on another device, the user logs in using the
    same account credentials.
4.  The user manages expenses and categories on the Home page.
5.  The user reviews records using the built-in and custom filters on
    the Filters page.
6.  The user analyzes spending on the Reports page, selects a currency
    and reporting filters, and optionally downloads an export.
7.  The user can visit the About page for static application and
    developer information.
8.  The user logs out explicitly or their authenticated session ends
    when the browser session ends.

### b. User Flows

**Registration** 1. Open the website while no account has been
registered for the account context. 2. Display the registration screen.
3. Enter a username and password. 4. Select a security question from a
predefined list and provide an answer. 5. Submit registration. 6. On
successful registration, authenticate the user and provide access to the
application.

**Login** 1. Open the website with an existing account. 2. Enter
username and password. 3. Submit credentials. 4. On successful
authentication, open the application. 5. On invalid credentials, show an
understandable error and allow another attempt.

**Add an expense** 1. Open Home. 2. Select a category and currency. 3.
Enter the description, amount, and expense date. 4. Validate required
fields and business rules. 5. Submit the form. 6. Save the expense
centrally and refresh the Home expense table.

**Edit an expense** 1. Locate the expense in the Home table. 2. Select
its Update action. 3. Load the existing values into the expense form. 4.
Modify the desired values and submit. 5. Validate and save the updated
expense.

**Delete an expense** 1. Locate the expense in the Home table. 2. Select
Delete. 3. Display a confirmation dialog. 4. Delete the expense only
after confirmation and refresh the table.

**Manage categories** 1. Open the category management controls. 2. Add a
category, or select an existing category to rename or delete it. 3.
Prevent deletion if the category is assigned to one or more expenses. 4.
Persist successful changes centrally.

**Filter expenses** 1. Open Filters. 2. Select one or more built-in
criteria: year; year and month; year, month, and day; and/or maximum
amount. 3. Alternatively, create a custom filter using a date range
and/or description keyword. 4. Combine the date range and keyword when
desired. 5. Display matching expenses in the Filters page table,
independently of the Home table. 6. Save a custom filter with a name for
reuse, or select a previously saved filter.

**View reports and export** 1. Open Reports. 2. Select a currency. 3.
Optionally select a date range and/or category. 4. View the category pie
chart and yearly/monthly column charts for the selected currency and
report filters. 5. Choose whether to export all expenses or only
expenses matching the current report filters. 6. Select CSV or PDF and
download the generated file.

**Change password** 1. Open the password change option. 2. Provide the
current password and the new password. 3. Submit the change and receive
a success or validation message.

**Recover password** 1. Select the password recovery option from the
login flow. 2. Provide the account identifier requested by the
application. 3. Answer the security question selected during
registration. 4. If the answer is correct, proceed to set a new
password; otherwise, show an error and do not change the password.

**About** 1. Select About from the navigation menu. 2. View the static
application description, developer description, and developer
photograph.

### c. UX Requirements

-   Provide a consistent layout across all pages, with a main heading
    and navigation menu on each page.
-   Use an aesthetically clear, consistent visual design.
-   Use responsive layouts suitable for mobile, tablet, and desktop
    screens.
-   Keep forms, tables, filters, and reports understandable and easy to
    navigate.
-   Display clear validation and error messages near the relevant
    interaction.
-   Require confirmation before deleting an expense.
-   Keep the Home and Filters expense tables independent.
-   Use progressive loading rather than presenting an unbounded expense
    list: initially show 25 records and load the next 25 on each Load
    More action.
-   Provide ascending and descending sorting by date, amount, and
    category in both expense tables.
-   All user-facing interface text must be in English.

## 4. Functional Requirements

### a. Features & Functional Requirements

#### 1. Account Registration and Authentication

-   Support one individual user account per user.
-   On first-time registration, collect a username, password, a security
    question selected from a predefined list, and its answer.
-   On subsequent visits and on other devices, authenticate using the
    same account credentials.
-   Provide login and explicit logout.
-   Use session-based authentication: authentication ends when the
    browser session ends.
-   Provide a Change Password flow that requires the current password.
-   Provide password recovery using the security question and answer
    configured at registration.
-   Store passwords securely; do not store plaintext passwords.
-   Restrict access to authenticated users' personal expense data.

#### 2. Application Navigation and Pages

-   Provide four pages: Home, Filters, Reports, and About.
-   Every page must include a consistent layout, a main heading,
    navigation to the other pages, and an aesthetically clear design.
-   The website must adapt to mobile, tablet, and desktop screen sizes.

#### 3. Expense Management --- Home

-   Provide a form to create a new expense and update an existing
    expense.
-   Each expense must contain:
    -   Category.
    -   Description.
    -   Amount.
    -   Currency.
    -   Expense date.
-   Category, amount, and date are required.
-   Description is required when the selected category is **Other**. For
    other categories, the description is not required by the defined
    validation rules.
-   Amount must be greater than zero and no greater than 100,000,
    regardless of currency.
-   Expense date must be today or an earlier date. Time-of-day is not
    part of the expense date.
-   Provide predefined categories on initial setup:
    -   Food
    -   Fuel
    -   Leisure
    -   Utilities & Bills
    -   Shopping
    -   Transportation
    -   Health
    -   Education
    -   Housing
    -   Other
-   Allow users to add, rename, and delete categories, including
    predefined categories.
-   Do not allow deletion of a category while it is assigned to any
    expense.
-   Display expenses in a table below the form.
-   Provide an Update action and a Delete action for each expense.
-   Require confirmation before deleting an expense.
-   Provide sorting by date, amount, and category, in ascending or
    descending order.
-   Initially display 25 expenses. Each Load More action displays the
    next 25.
-   Persist expenses and category changes in centralized storage so they
    are available across devices.

#### 4. Expense Filtering --- Filters

-   Provide a dedicated expense table on this page; it must be
    independent of the Home page table.
-   Support built-in filters:
    -   Year: show expenses from the selected year.
    -   Year and month: show expenses from the selected month in the
        selected year.
    -   Year, month, and day: show expenses from the selected date.
    -   Maximum amount: show expenses whose amount is no greater than
        the entered maximum.
-   Support custom filters using:
    -   Date range (start date and end date).
    -   Description keyword search.
-   Allow date range and description keyword search to be combined in
    one custom filter.
-   Allow users to name and save custom filter configurations and reuse
    saved configurations.
-   Persist saved custom filters centrally across devices.
-   Provide sorting by date, amount, and category, in ascending or
    descending order.
-   Initially display 25 matching expenses. Each Load More action
    displays the next 25 matching expenses.
-   Applying or changing filters must update the Filters page results,
    not the Home page table.

#### 5. Reports

-   Provide a pie chart showing expenses by category.
-   Provide column charts showing expenses by year and by month.
-   Provide both yearly and monthly chart views, with the ability to
    switch between yearly and monthly detail.
-   Provide a currency selector. Charts must show expenses only in the
    selected currency.
-   Provide report filters for date range and expense category.
-   Do not combine amounts from different currencies into a single
    total. No exchange-rate conversion is required.
-   Report charts and totals must respect the selected currency and
    report filters.

#### 6. CSV and PDF Exports

-   Provide CSV and PDF export actions on the Reports page.
-   Before generating an export, let the user choose between:
    -   All expenses.
    -   Only expenses matching the currently selected report filters.
-   CSV export must create and download a file containing the selected
    expense records.
-   PDF export must create and download a clearly formatted, readable
    file containing the selected expense records.
-   Preserve currency information in exported records.
-   Do not combine different currencies into a single converted total in
    exports.

#### 7. About

-   Display a static explanation of the application.
-   Display a static description of the student/developer.
-   Display a static photograph of the student/developer.
-   About content is defined during development; editing it through the
    application is not required.

#### 8. Data Storage and Cross-Device Access

-   Use centralized storage as the primary source of truth.
-   The same account must access shared expenses, categories, and saved
    filters from mobile and desktop devices.
-   Local Storage may be used for optional caching, but it must not be
    the only persistent data store.
-   Data must remain available across authenticated sessions and
    supported devices.
-   No user-facing backup or restore feature is included.

### b. Edge Cases & Error Handling

-   Reject an expense with a missing category, amount, or date.
-   Reject an expense with an amount less than or equal to zero or
    greater than 100,000.
-   Reject a future expense date.
-   Require a description when the selected category is Other.
-   Prevent deletion of a category that is used by existing expenses and
    explain why deletion is unavailable.
-   Do not show future years or invalid date combinations as valid
    filter selections where they cannot match expenses.
-   Handle custom filters that return no matching expenses with a clear
    empty state.
-   Handle saved-filter names that are missing or otherwise invalid with
    a clear validation message.
-   Handle an end date earlier than a start date as an invalid date
    range.
-   Handle empty description keywords with validation or treat the
    keyword criterion as unset; the behavior should be consistent and
    clearly communicated.
-   Handle report filters or currency selections that return no records
    with an appropriate empty chart/report state.
-   Ensure totals and charts never aggregate values across different
    currencies.
-   If the user chooses filtered export when no report filters are
    active, export the current report result set (which may include all
    expenses); make the selected scope clear.
-   Handle failed login, incorrect security-question answers, and
    password-change validation without changing credentials.
-   Handle network or server failures with a clear message and avoid
    indicating that an unsaved operation succeeded.
-   Handle an expired session by requiring the user to authenticate
    again.
-   If a user attempts to delete an expense, do not delete it unless the
    confirmation action is accepted.

## 5. Technical Requirements and Constraints

### a. Technical Requirements

-   **Platform:** Responsive website.
-   **Devices:** Mobile phones, tablets, and desktop computers.
-   **Browsers:** Latest versions of Chrome, Edge, Firefox, and Safari.
-   **Interface language:** English only.
-   **Authentication:** Account registration, login, logout, password
    change, and security-question-based password recovery.
-   **Session behavior:** Session-based; authentication ends when the
    browser session ends.
-   **Persistence:** Centralized storage is required for cross-device
    synchronization. Local Storage is optional for caching only.
-   **Connectivity:** Online-only; an internet connection is required to
    use the application.
-   **Charts:** Pie and column charts, with currency selection and
    report filters.
-   **Exports:** Downloadable CSV and PDF files.
-   **Security:** Secure password storage, authenticated access to
    personal data, and HTTPS communication.

### b. Constraints

-   The product is designed for a single individual account owner, not
    multiple users collaborating on shared expenses.
-   Expense amounts are limited to a positive value up to and including
    100,000 per expense, for every supported currency.
-   Supported currencies are fixed to:
    -   ILS --- Israeli Shekel (₪)
    -   USD --- US Dollar (\$)
    -   EUR --- Euro (€)
    -   GBP --- British Pound (£)
    -   CAD --- Canadian Dollar (C\$)
    -   AUD --- Australian Dollar (A\$)
    -   JPY --- Japanese Yen (¥)
    -   CHF --- Swiss Franc (CHF)
-   Each expense has one selected currency.
-   Different currencies must be reported separately. Currency
    conversion and exchange-rate integration are not included.
-   The application requires an internet connection.
-   Centralized storage is necessary to support shared data across
    mobile and desktop.
-   Local Storage alone is insufficient for cross-device
    synchronization.
-   No user-facing backup or restore capability is included.
-   No advanced security mechanisms beyond the approved basic security
    requirements are specified.
-   The exact predefined security-question list and developer/About
    content (including the photograph) must be supplied or finalized
    during implementation; they have not been specified in this PRD.

## 6. Out of Scope

-   Native iOS or Android applications; the product is a responsive
    website.
-   Offline operation.
-   Automatic currency conversion or exchange-rate retrieval.
-   Combining different currencies into one converted total.
-   User-configurable currency lists; only the approved fixed list is
    supported.
-   User-facing data backup and restore.
-   Shared household, team, or multi-user expense collaboration.
-   Editing About-page content through the website.
-   Advanced security features such as automatic inactivity logout,
    repeated-login-attempt lockout, or remote logout from all devices;
    these were not selected.
-   Custom filtering criteria beyond date range and description keyword
    search, in addition to the separately specified built-in year,
    month, day, and maximum-amount filters.
