# registry-hooks

Hooks for decoupling view from external dependencies.

Example implementaion of Service Locator pattern, where downstream components retrieve external dependencies from shared Provider, responsible for searching and instantiation. API inspired by [rest-hooks](https://resthooks.io) library.

## Install

```bash
npm install registry-hooks
```

## HowTo

```javascript
// Create driver utility, used for connecting tokens with external resource, handling subscriptions and performance optimizations
const createStateSubscription = (source, token, getValue) => {
  // Useful for adhering retrieved entity to defined model
  const valueSelector = createSelectorWithModel(getValue, token.model);

  const checkForUpdates = parameters => valueSelector(parameters);

  // Subscription instance has to implement following minimal API:
  return {
    // Used for synchronously reading entity value
    read: parameters => checkForUpdates(parameters),
    // Used to notify dependent component about changed value
    subscribe: notify => {
      source.subscribe(() => notify());
    }
  };
};

// Define token with id and shape of external dependency
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

// Use driver and registry to resolve and instantiate resources
const registry = {
  [Todo.type]: (state, { parameters: { id } }) => state.todos[id]
};

const AppResourcesProvider = ({ store, children }) => {
  const getResource = useMemo(token => {
    // Get selector for given token
    const selector = registry[token.type];

    return createStateSubscription(store, token, parameters => {
      return selector(store.getState(), { parameters });
    });
  }, []);

  return (
    <ResourseContext.Provider value={getResource}>
      {children}
    </ResourseContext.Provider>
  );
};

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
