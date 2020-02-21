import React, {
  useReducer,
  useRef,
  useEffect,
  useContext,
  useMemo,
  useLayoutEffect
} from "react";
import { shallowEqualObjects } from "shallow-equal";

const useForceUpdate = () => {
  const [, forceUpdate] = useReducer(s => s + 1, 0);
  return forceUpdate;
};

const usePrevious = next => {
  const prevCountRef = useRef();
  useEffect(() => {
    prevCountRef.current = next;
  });
  return prevCountRef.current;
};

export const ResourceContext = React.createContext();

export const useResource = (token, pendingParameters) => {
  const getResource = useContext(ResourceContext);

  const resource = useMemo(() => {
    return getResource(token);
  }, [token]);

  const forceUpdate = useForceUpdate();

  useLayoutEffect(() => {
    return resource.subscribe(forceUpdate);
  }, [resource]);

  const previousParameters = usePrevious(pendingParameters);
  const hasChanged = shallowEqualObjects(pendingParameters, previousParameters);

  let parameters;
  if (!previousParameters || hasChanged) {
    parameters = pendingParameters;
  } else {
    parameters = previousParameters;
  }

  return resource.read(parameters);
};
