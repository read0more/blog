---
title: "Rethinking useEffect Dependencies"
description: "Three rules for writing correct effect dependencies."
---

## Dependencies Describe What an Effect Reads

The dependency array determines when React runs an effect again. Include the values the effect reads.

```jsx
useEffect(() => {
  const timer = setInterval(() => setCount((count) => count + 1), 1000);
  return () => clearInterval(timer);
}, []);
```

## Avoid Unstable References

Move objects into the effect or depend on primitive values.

## Three Rules

- Include the values an effect reads.
- Avoid unnecessary object and function dependencies.
- Use functional updates when the next state depends on the previous state.
