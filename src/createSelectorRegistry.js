const createSelectorRegistry = () => {
  const registry = {};
  return {
    register: (token, factory) => {
      registry[token.type] = factory;
    },
    getEntity: token => {
      const factory = registry[token.type];
      if (!factory) return;
      return factory();
    }
  };
};

export default createSelectorRegistry;
