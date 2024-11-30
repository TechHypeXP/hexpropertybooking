# Template Version Control

## Version Format
```
[major].[minor].[patch]-[status]
Example: 1.0.0-draft
```

## Template Types
1. Technical Documentation (TD)
2. API Documentation (API)
3. Architecture Decision Record (ADR)
4. Code Review Template (CR)
5. Test Plan Template (TP)

## Version History
Each template should maintain its version history in the following format:

```yaml
template_id: [type]-[name]
current_version: 1.0.0
status: active
history:
  - version: 1.0.0
    date: 2024-11-28
    author: [author]
    changes:
      - Initial template creation
      - Basic structure defined
  - version: 1.0.1
    date: [date]
    author: [author]
    changes:
      - [change description]
```

## Template Inheritance
Templates can inherit from base templates:

```yaml
inherits_from: base_template.md
overrides:
  - section: Overview
    content: Custom overview content
  - section: Implementation
    content: Custom implementation details
```

## Documentation Guidelines
1. Every template must have a version
2. Version updates require change documentation
3. Templates should be backward compatible
4. Breaking changes require major version bump
