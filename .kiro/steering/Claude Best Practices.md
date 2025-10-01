<!------------------------------------------------------------------------------------
   Add Rules to this file or a short description and have Kiro refine them for you:   
-------------------------------------------------------------------------------------> 


### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Use clear, consistent imports** (prefer relative imports within packages).



### 🧪 Testing & Reliability
- **Always create unit tests for new features** (functions, classes, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.


### 🔒 Data Integrity & Performance
- **Implement idempotent operations** - All data modifications must be safe to retry without side effects.
- **Use deduplicative logic** - Prevent duplicate data creation and ensure data consistency across operations.
- **Apply effective filtering** - Always filter data at the source (database level) rather than in application code.
- **Limit result sets** - Use pagination, limits, and proper indexing to prevent performance issues.
- **Prioritize readability** - Code must be easily understood by team members at all skill levels.
- **Ensure performance** - Optimize queries, use appropriate data structures, and avoid N+1 problems.
- **Maintain code quality** - Write modular, testable code that can be easily modified and extended.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Python packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.