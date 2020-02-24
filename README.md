# registry-hooks

Hooks for decoupling view from external dependencies.

This is proposal and example implementaion of Service Locator pattern, where downstream components retrieve external dependencies from shared Provider, responsible for searching and instantiation.

Repo contains example implementation of following helper functions:

- `createSelectorWithModel` - will create selector, that will softly apply model to changed data, removing nonexisting fields and applying defaults.
- `createNotifierSubscription` - example implementation of subscription creator, designed for usage with notifier from [createNotifier](https://github.com/Freak613/create-notifier) library.
- `createSelectorRegistry` - simple registry object used for resolving and instantiating stateful selectors.
- `useResource` - hook for subscribing and reading resource data using given definition and parameters. Its API inspired by [rest-hooks](https://resthooks.io) library.

## Install

```bash
npm install registry-hooks
```

## The Gist

```javascript
// Create definition of entity with type and model of external dependency
// - type used for resolving dependency in Provider registry
// - model can be used for defaults and/or strict following of the contract
const Todo = {
  type: "todo",
  model: {
    id: 0,
    name: "",
    completed: false
  }
};

// Create registry and Provider to resolve and instantiate resources
import { ResourseContext, createSelectorWithModel } from "registry-hooks";

const registry = {
  [Todo.type]: (state, { id }) => state.todos[id]
};

const AppResourcesProvider = ({ store, children }) => {
  const getResource = useMemo(token => {
    const selector = registry[token.type];

    // Useful for adhering retrieved entity to defined model
    const valueSelector = createSelectorWithModel(selector, token.model);

    // Returned value has to implement following minimal API:
    return {
      // Used for synchronously reading entity value
      read: parameters => valueSelector(store.getState(), parameters),
      // Used to notify dependent component about changed value
      subscribe: notify => {
        store.subscribe(() => notify());
      }
    };
  }, []);

  return (
    <ResourseContext.Provider value={getResource}>
      {children}
    </ResourseContext.Provider>
  );
};

import { useResource } from "registry-hooks";

// useResource hook to request for external dependencies from Provider
const TodoItem = ({ id }) => {
  const todo = useResource(Todo, { id });
  // Now your component doesn't care about source of resource entity,
  // whether it's from some state or from network.
  // It only knows about API that this entity will have

  return (
    <div>
      {todo.name}
      {todo.completed}
    </div>
  );
};
```
