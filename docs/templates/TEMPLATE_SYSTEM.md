# Template System Documentation

## Overview
This document describes the template system used in the HexProperty Booking subsystem.

## Template Categories

### 1. Technical Documentation Template
```markdown
---
template_id: TD-[name]
version: 1.0.0
status: draft|active|deprecated
created_date: YYYY-MM-DD
last_updated: YYYY-MM-DD
author: [author]
reviewers: [reviewers]
---

# [Title]

## Overview
[High-level description of the technical component]

## Implementation Details
[Detailed technical implementation]

## Dependencies
[List of dependencies]

## Testing Strategy
[Testing approach]

## Security Considerations
[Security details]

## Performance Characteristics
[Performance details]
```

### 2. API Documentation Template
```markdown
---
template_id: API-[endpoint]
version: 1.0.0
status: draft|active|deprecated
created_date: YYYY-MM-DD
last_updated: YYYY-MM-DD
author: [author]
---

# [API Endpoint Name]

## Endpoint
\`[METHOD] /api/v1/[path]\`

## Description
[Endpoint description]

## Request
\`\`\`typescript
interface Request {
  [field: type] // description
}
\`\`\`

## Response
\`\`\`typescript
interface Response {
  [field: type] // description
}
\`\`\`

## Error Codes
| Code | Description |
|------|-------------|
| [code] | [description] |

## Examples
[Request/Response examples]
```

### 3. Architecture Decision Record Template
```markdown
---
template_id: ADR-[number]
version: 1.0.0
status: proposed|accepted|rejected|deprecated
created_date: YYYY-MM-DD
last_updated: YYYY-MM-DD
author: [author]
---

# [Title]

## Status
[Current status]

## Context
[What is the issue that we're seeing?]

## Decision
[What is the change we're proposing?]

## Consequences
[What becomes easier or more difficult?]

## Alternatives Considered
[What other approaches were considered?]

## Implementation Plan
[How will this be implemented?]
```

## Usage Guidelines

### 1. Template Selection
1. Choose the appropriate template for your documentation
2. Check the template version
3. Follow the structure exactly

### 2. Content Guidelines
1. Be concise but complete
2. Use code examples where appropriate
3. Include diagrams when helpful
4. Reference related documents

### 3. Review Process
1. Self-review against template
2. Technical review
3. Documentation review
4. Version update if needed

## Template Maintenance

### 1. Version Updates
- Document all changes
- Update version number
- Keep change history

### 2. Template Review
- Regular review schedule
- Collect feedback
- Update based on usage

### 3. Template Retirement
- Mark as deprecated
- Provide migration path
- Archive old versions
