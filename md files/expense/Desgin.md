# DESIGN.md

## 1. Screens – Application Screens

The application comprises a set of main operational screens structured to guide the user from authentication through central expense tracking, analysis, and system architecture visibility. Below is the description of each screen based on the design mockups and wireframes:

*   **Registration**
    *   **Screen Purpose:** Enables new users to create a secure personal account by providing credentials and setting up a password recovery security question[cite: 1, 2].
    *   **Structure and Content:** Features a centered card layout containing input fields for Username and Password, a dropdown selector for the pre-defined Security Question, an input field for the Security Answer, and primary action buttons (`Register` / `Submit` and `Back`)[cite: 13, 14].
    *   **Actions and Navigation:** Submitting valid registration data authenticates the user and transitions them into the main application; clicking back returns to the login entry point[cite: 13, 14].

*   **Login**
    *   **Screen Purpose:** Provides returning users with secure access to their central expense database across devices[cite: 1, 2].
    *   **Structure and Content:** Displays input fields for Username and Password, a prominent primary `Log In` button, secondary recovery controls (`Recover Password`), and a link redirecting to the Registration screen[cite: 13, 14].
    *   **Actions and Navigation:** Authenticates user credentials to access the Home screen or navigates to the recovery/registration flows[cite: 13, 14].

*   **Home**
    *   **Screen Purpose:** Acts as the central hub for managing expenses, allowing users to add, update, delete, and view paginated expense records alongside category selections[cite: 1, 2].
    *   **Structure and Content:** Utilizes a persistent side navigation menu, a top-aligned "New Expense" form containing fields for Amount, Category dropdown, Date, and Description, and a "Recent Expenses" table featuring columns for Date, Amount, and Category with row action buttons (`Update`, `Delete`) and a `Load More` pagination trigger[cite: 13, 14].
    *   **Actions and Navigation:** Users can perform CRUD operations on expenses or use the left-hand navigation menu to seamlessly switch between Home, Expense Filters, Categories management, Reports, and About views[cite: 13, 14].

*   **Categories**
    *   **Screen Purpose:** Empowers users to manage custom and predefined expense categories (adding, renaming, or deleting)[cite: 1, 2].
    *   **Structure and Content:** Displays a side navigation menu alongside a "Category Management" module containing a list/table of active categories, action buttons (`Add Category`, `Rename`, `Delete`), and an associated expenses breakdown table[cite: 13, 14].
    *   **Actions and Navigation:** Modifies category mappings which dynamically update across expense creation modules, with standard navigation links to other application pages[cite: 13, 14].

*   **Filters**
    *   **Screen Purpose:** Provides an independent workspace to query and filter expense records using built-in constraints or custom keyword/date parameters, with options to save configurations[cite: 1, 2].
    *   **Structure and Content:** Features a side navigation bar, an independent expense results table, a structured panel for built-in filters (Year, Month, Date, Max Amount), custom range controls, and a saved filters selector component[cite: 13, 14].
    *   **Actions and Navigation:** Applying filters updates the isolated results table; custom filters can be saved for rapid future retrieval[cite: 1, 2, 13, 14].

*   **Reports**
    *   **Screen Purpose:** Delivers visual analytics and summary insights into spending habits categorized by currencies, categories, years, and months, alongside export tools[cite: 1, 2].
    *   **Structure and Content:** Includes top-level currency and date range selectors, a category breakdown Pie Chart, Yearly and Monthly Column Charts powered by Recharts, and prominent export triggers (`Export to CSV`, `Export to PDF`)[cite: 1, 2, 13, 14].
    *   **Actions and Navigation:** Users can switch reporting metrics or trigger file downloads of filtered or complete datasets[cite: 1, 2].

*   **Change Password**
    *   **Screen Purpose:** Allows authenticated users to securely update their account password by verifying their existing credentials[cite: 1, 2].
    *   **Structure and Content:** Features a centered modal/card layout containing input fields for `Current Password`, `New Password`, and `Confirm Password`, alongside `Change Password` / `Submit` and `Back` buttons[cite: 13, 14].
    *   **Actions and Navigation:** Successfully submitting updates the security credentials or returns the user to the application dashboard[cite: 13, 14].

*   **About**
    *   **Screen Purpose:** Displays static metadata regarding the application and the developer profile[cite: 1, 2].
    *   **Structure and Content:** Renders static text blocks describing the application and student/developer background, accompanied by a dedicated placeholder frame for a developer photograph[cite: 13, 14].
    *   **Actions and Navigation:** Serves as a static reference page accessible from the primary navigation menu[cite: 1, 2, 13, 14].

*   **Architecture Diagram**
    *   **Screen Purpose:** Provides a structural system diagram outlining the application's technical topology, database schema relationships, and deployment pipeline.
    *   **Structure and Content:** Consists of structured block diagrams mapping out Database Schema entities (Auth User, Expense, Saved Filter) and Centralized Supabase/Vercel backend infrastructure relationships[cite: 13, 14].
    *   **Actions and Navigation:** Serves as a technical documentation visual layout