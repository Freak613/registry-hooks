# registry-hooks

Hooks for decoupling view from external dependencies.

This is proposal and example implementaion of Service Locator pattern, where downstream components retrieve external dependencies from single shared Provider, responsible for searching and instantiation.

## Motivation

### Problem #1

In today era of React Hooks and Contexts we're used to wrap components external dependencies in their own contexts like

```javascript
const DomainComponent = () => {
  const state = useContext(StateContext);
  const network = useContext(NetworkContext);
  const window = useContext(WindowContext); // we're not going to access globals, right?
  // Do some stuff
};
```

And to test such components or adopt them in new environment we have to do

```javascript
const App = () => (
  <StateProvider>
    <NetworkProvider>
      <WindowProvider>
        <DomainComponent />
      </WindowProvider>
    </NetworkProvider>
  </StateProvider>
);
```

When we'll start importing external libs and build more functionality, amount of Contexts can grow significantly.

In alternative approach we can use single `registry` from parent tree to resolve external dependencies:

```javascript
const State = "state";
const Network = "network";
const Window = "window";

const DomainComponent = () => {
  // same `useResource` bus using for all external dependencies
  const state = useResource(State);
  const network = useResource(Network);
  const window = useResource(Window);
  // Do some stuff
};

const App = () => {
  const resolver = useMemo(token => {
    switch (token) {
      case State:
        return someState;
      case Network:
        return fetch;
      case Window:
        return window;
      default:
    }
  }, []);

  return (
    <ResourseContext.Provider value={resolver}>
      <DomainComponent />
    </ResourseContext.Provider>
  );
};
```

### Problem #2

When we start adopting external/global state, we going to create tight connection between our component, shape of external state and state management library:

```javascript
const DomainComponent = () => {
  // External StoreContext
  const todos = useSelector(state => state.my.very.deep.slice);
  const selectedItem = useSelector(state => state.some.other.slice);

  // External DispatchContext
  const dispatch = useDispatch();
  const selectTodo = id => dispatch({ type: "selectTodo", id });
  const addTodo = todo => dispatch({ type: "addTodo", todo });
  const removeTodo = id => dispatch({ type: "removeTodo", id });

  // ...
};
```

When we'll try to test or import such component in another project, we have to implement same state shape and provide all libraries dependencies:

```javascript
const DomainComponentDependencies = ({ children }) => {
  const state = {
    my: {
      very: {
        deep: {
          slice: []
        }
      }
    },
    some: {
      other: {
        slice: "1"
      }
    }
  };

  const dispatch = action => updateState(state, action);

  return (
    <StoreContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StoreContext.Provider>
  );
};
```

As alternative, we could use React Contexts for each slice of state, but per React docs it's not recommended to overuse them, so we're very limited on amount of Contexts we can create.

To overcome this limitation, we can build single `registry` Context to resolve each slice of state, exactly **Treat our external state dependencies as any other resource dependency**. At the same time, we can abstract state management library, so our component will be unaware of it:

```javascript
const TodosSlice = "state/todos";
const SelectedItemSlice = "state/selectedItem";

const DomainComponent = () => {
  const todos = useResource(TodosSlice);
  const selectedItem = useResource(SelectedItemSlice);

  const { addTodo, removeTodo } = todos.actions;
  const { selectTodo } = selectedItem.actions;
  // ...
};

const App = () => {
  const resolver = useMemo(token => {
    switch (token) {
      case TodosSlice:
        return {
          state: state.my.very.deep.slice,
          actions: {
            addTodo: () => dispatch(),
            removeTodo: () => dispatch()
          }
        };
      case SelectedItemSlice:
        return {
          state: state.some.other.slice,
          actions: {
            selectTodo: () => dispatch()
          }
        };
      default:
    }
  }, []);

  return (
    <ResourseContext.Provider value={resolver}>
      <DomainComponent />
    </ResourseContext.Provider>
  );
};
```

In this case `DomainComponent`:

- Is decoupled from state shape and state library we're using.
- If we decide to change state management library or to refactor state shape, all we have to do is to update registry `resolver`, without touching our components;
- If we going to test this component or to import it to another project, all we have to to is to wrap it with single `ResourceProvider` (or utilize existing one) to create glue-code connecting component to our environment. We don't have to use the same state management library or reimplement same state shape. Dependenceies of our component are flat and, optionally, have strict API that we need to implement. Component declares `what it needs` instead of `how we have to build it`.

For sure, we could get very close results for example with `Redux` and its `Ducks` pattern, where we store reducers, actions and selections in one file close to each other, so our component could utilize these selectors and action creators. But it's still our component providing implementation, instead of relying on external management to create these implementations for us.

## This repo

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

// useResource hook to request external dependencies from Provider
const TodoItem = ({ id }) => {
  const todo = useResource(Todo, { id });
  // Now your component have read and subscribed to changes in this entity.
  // It doesn't know about source of resource entity,
  // and only knows about API that this entity will have.

  return (
    <div>
      {todo.name}
      {todo.completed}
    </div>
  );
};
```
