import createSelectorWithModel from "./createSelectorWithModel";

const createNotifierSubscription = (notifier, token, getNextValue) => {
  const nextValueSelector = createSelectorWithModel(getNextValue, token.model);

  let lastParameters;
  let lastValue;
  let lastAge;
  const checkForUpdates = (parameters = lastParameters) => {
    const expired = parameters !== lastParameters;
    lastParameters = parameters;

    const sourceAge = notifier.getAge();

    if (sourceAge === lastAge && !expired) return lastValue;
    lastAge = sourceAge;

    return (lastValue = nextValueSelector(parameters));
  };

  return {
    read: checkForUpdates,
    subscribe: notify => {
      return notifier.subscribe(() => {
        if (lastValue !== checkForUpdates()) notify();
      });
    }
  };
};

export default createNotifierSubscription;
