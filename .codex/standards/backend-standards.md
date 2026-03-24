# Backend Standards

## Core Principles
- Write code that reads clearly and naturally.
- Keep solutions simple, direct, and maintainable.
- Follow **Clean Architecture**, **DDD**, and **FluentValidation**.
- Avoid unnecessary complexity, duplication, and dead code.

## Comments
- Add a short purpose comment to any class that is not immediately obvious.
- Add a short purpose comment to all public methods.
- Add comments before non-obvious logic or assumptions.
- Do not comment trivial code.

## Class and Method Size
- Keep classes focused on a single responsibility.
- As a rule of thumb, classes longer than **350 lines** are probably too large.
- Keep methods short enough to understand without scrolling where possible.
- Extract clearly named helper methods when logic grows.

## Class Layout
- Order members logically.
- Group related fields, properties, and methods together.
- Place methods in the order they are typically called.
- Put helper methods directly below the parent method where practical.
- Use `#region` only when a class is long enough to benefit from extra structure.

## Readability Rules
- Use guard clauses for preconditions.
- Prefer **Ardalis.GuardClauses** as the standard guard clause library.
- Avoid excessive nesting; refactor when nesting gets too deep.
- Use clear, consistent names for variables, methods, and classes.
- Replace magic numbers with constants or enums.
- Apply **DRY**: extract repeated logic into reusable methods.
- Apply **KISS**: simple code is preferred over clever code.

## Formatting
- Keep code properly formatted at all times.
- Remove unused code promptly.
- Use IDE formatting tools before committing.

## Performance
- Avoid loops that trigger repeated database calls when one query can do the job.
- Avoid repeated row-by-row updates when a bulk update is possible.
- Add indexing for frequently queried data.
- Be mindful of query efficiency and database round trips.

## Architecture Rules
- Follow the approved solution template and folder structure.
- Place each class in the correct layer.
- Keep **domain logic out of AppServices**.
- Do not place DTOs in the domain layer unless there is a justified domain-service exception.

## DTO Rules
- DTOs should live beside the AppService that uses them, usually in a `Dtos` folder.
- For single-purpose DTOs, use endpoint-based naming:
  - `CreateFieldServiceProfileRequest`
  - `UpdateCustomerRequest`
  - `GetOrderResponse`

## Validation
- Use **FluentValidation** for request validation.
- Keep validation rules out of controllers and AppServices where possible.

## Final Checklist
Before committing, confirm that:
- the code is clear and easy to follow
- comments exist where needed
- classes and methods are not too large
- guard clauses are used for preconditions
- logic is not overly nested
- no magic numbers remain
- duplication has been removed
- formatting is clean
- dead code is deleted
- architecture boundaries are respected
