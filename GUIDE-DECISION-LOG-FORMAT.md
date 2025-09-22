# 📝 Decision Log Format Guide

This guide provides detailed format examples for documenting decisions in the Agent.md Decision Log & Context section. Use these templates to maintain consistent decision documentation across the project.

## 📋 Table of Contents

1. [Purpose & Guidelines](#purpose--guidelines)
2. [Technical Decision Format](#technical-decision-format)
3. [Strategic Decision Format](#strategic-decision-format)
4. [Format Guidelines](#format-guidelines)
5. [Best Practices](#best-practices)

---

## 🎯 Purpose & Guidelines

### Why Document Decisions?

- **Institutional Knowledge**: Preserve reasoning behind important choices
- **Context for Future AI Agents**: Provide background for informed decision-making
- **Avoid Revisiting Rejected Options**: Document alternatives that were considered and why they were rejected
- **Track Decision Evolution**: Monitor how strategic and technical approaches change over time

### When to Document

Document decisions that affect:

- System architecture and technology choices
- Business logic and user experience patterns
- Development workflow and processes
- Strategic business direction
- Performance and scalability approaches

---

## 🔧 Technical Decision Format

Use this format for documenting technical and architectural decisions:

### Template

```
**Date**: YYYY-MM-DD
**Decision**: [Clear, concise description of what was decided]
**Reasoning**: [Why this decision was made, what problem it solved]
**Impact**: [How this affects the codebase, architecture, or workflow]
**Alternatives Considered**:
- [Option 1] (rejected: reason)
- [Option 2] (rejected: reason)
- [Option 3] (considered but not chosen: reason)
**Status**: [Active/Deprecated/Under Review]
```

### Real Example

```
**Date**: 2025-09-22
**Decision**: Implement drop-based inventory system instead of daily inventory management
**Reasoning**: Provides better business flexibility for production planning and creates natural scarcity that drives customer urgency. Allows manual control over when drops close rather than automatic daily cutoffs.
**Impact**: Required new database tables (drops, drop_products), modified order flow to reference drops instead of dates, added admin interface for drop management
**Alternatives Considered**:
- Daily inventory with automatic cutoffs (rejected: too rigid for business needs)
- Unlimited inventory (rejected: no scarcity mechanism)
- Time-based ordering windows (rejected: doesn't align with production batches)
**Status**: Active
```

### Another Example

```
**Date**: 2025-09-18
**Decision**: Use Supabase instead of traditional PostgreSQL + separate auth service
**Reasoning**: Integrated solution provides database, authentication, real-time subscriptions, and file storage in one platform. Reduces complexity and maintenance overhead for small team.
**Impact**: Simplified backend architecture, faster development velocity, built-in Row Level Security, real-time inventory updates without additional infrastructure
**Alternatives Considered**:
- PostgreSQL + Auth0 + Redis (rejected: too many moving parts)
- Firebase (rejected: vendor lock-in concerns, less SQL flexibility)
- Custom Node.js backend (rejected: development time constraints)
**Status**: Active
```

---

## 🎯 Strategic Decision Format

Use this format for documenting business and strategic decisions:

### Template

```
**Date**: YYYY-MM-DD
**Decision**: [Brief description of strategic choice]
**Business Reasoning**: [Why this supports business goals]
**Technical Implications**: [How this affects development approach]
**Success Metrics**: [How we'll measure if this was the right choice]
**Alternatives Considered**:
- [Option 1] (rejected: reason)
- [Option 2] (considered: reason for not choosing)
**Status**: [Active/Under Review/Pivoted]
```

### Real Example

```
**Date**: 2025-09-22
**Decision**: Target coworking spaces as primary customer base for pilot launch
**Business Reasoning**: Concentrated customer base with predictable lunch timing, easier logistics for delivery, tech-savvy users comfortable with pre-ordering apps, potential for word-of-mouth growth within communities
**Technical Implications**: Optimized mobile-first design for on-the-go ordering, location-based delivery system, admin tools for managing multiple delivery points
**Success Metrics**:
- 80% of orders from target coworking space within first month
- Average order time under 2 minutes
- 90%+ successful deliveries on time
**Alternatives Considered**:
- General public launch (rejected: too broad, harder to optimize for)
- Office building partnerships (considered: more complex logistics)
- University campuses (rejected: seasonal demand fluctuations)
**Status**: Active - pilot phase
```

### Another Example

```
**Date**: 2025-09-15
**Decision**: Start with 2 drops per week instead of daily availability
**Business Reasoning**: Allows better production planning, creates scarcity and urgency, matches current production capacity, enables quality focus over quantity
**Technical Implications**: Drop-based ordering system, advance scheduling interface, inventory management per drop rather than daily
**Success Metrics**:
- 90%+ sell-out rate per drop
- Zero food waste
- Customer satisfaction with ordering experience
- Manageable production workload
**Alternatives Considered**:
- Daily availability (rejected: production capacity constraints)
- Weekly single drop (rejected: insufficient customer touchpoints)
- On-demand ordering (rejected: unpredictable production needs)
**Status**: Active - monitoring for optimization
```

---

## 📐 Format Guidelines

### Required Fields

- **Date**: Always use YYYY-MM-DD format for consistency
- **Decision**: Clear, concise description of what was decided
- **Reasoning/Business Reasoning**: The "why" behind the decision
- **Impact/Technical Implications**: How this affects the codebase or business
- **Alternatives Considered**: Other options that were evaluated
- **Status**: Current state of the decision

### Status Options

- **Active**: Currently implemented and working
- **Deprecated**: No longer used, replaced by something else
- **Under Review**: Being reconsidered or evaluated
- **Pivoted**: Changed direction based on new information

### Writing Style

- **Be Specific**: Avoid vague language, provide concrete details
- **Include Context**: Explain the situation that led to the decision
- **Document Alternatives**: Show what else was considered and why it was rejected
- **Use Present Tense**: For active decisions, describe current state
- **Be Honest**: Include both positive and negative aspects

---

## ✅ Best Practices

### For AI Agents

1. **Document Immediately**: Add entries right after making significant decisions
2. **Update Status**: Change status when decisions are revisited or deprecated
3. **Cross-Reference**: Link to related code files or documentation when relevant
4. **Be Comprehensive**: Include enough detail for future agents to understand without additional context

### For Decision Quality

1. **Consider Multiple Options**: Always evaluate at least 2-3 alternatives
2. **Define Success Metrics**: Especially for strategic decisions
3. **Set Review Dates**: For experimental or temporary decisions
4. **Learn from Outcomes**: Update entries with results when available

### Maintenance

1. **Regular Review**: Check decision relevance during related code changes
2. **Archive Old Decisions**: Move deprecated decisions to a separate section if needed
3. **Update Impact**: Modify impact descriptions as consequences become clear
4. **Link to Code**: Reference specific files or components affected by decisions

---

## 🔗 Integration with Agent.md

This guide supports the Decision Log & Context section in Agent.md. When documenting decisions:

1. **Add entries** to the appropriate section (Technical or Strategic) in Agent.md
2. **Follow the formats** provided in this guide
3. **Reference this guide** when unsure about format details
4. **Update Agent.md** if decision formats evolve

Remember: The goal is to maintain institutional knowledge and provide context for future development decisions.
