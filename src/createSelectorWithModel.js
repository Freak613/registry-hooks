const PRIMITIVES = ["string", "number", "boolean"];
const isPrimitive = v => PRIMITIVES.includes(typeof v);

const applyModel = (result, model) => {
  if (model === undefined || model === null) return result;
  if (result === null) return result;

  const modelType = typeof model;
  const resultType = typeof result;

  if (isPrimitive(model)) {
    if (result === undefined) return model;
    if (modelType !== resultType) return model;
    return result;
  }
  if (Array.isArray(model)) {
    if (result === undefined) return model.slice();
    if (!Array.isArray(result)) return model.slice();
    return result;
  }

  if (result === undefined) return { ...model };
  return Object.keys(model).reduce((acc, key) => {
    const modelValue = model[key];
    const resultValue = result[key];
    if (resultValue === undefined) {
      return { ...acc, [key]: modelValue };
    }
    return { ...acc, [key]: resultValue };
  }, {});
};

const createSelectorWithModel = (fn, model) => {
  let lastState;
  let lastResult;
  return (...args) => {
    const nextState = fn(...args);
    if (nextState === lastState) return lastResult;
    lastState = nextState;
    lastResult = applyModel(nextState, model);
    return lastResult;
  };
};

export default createSelectorWithModel;
