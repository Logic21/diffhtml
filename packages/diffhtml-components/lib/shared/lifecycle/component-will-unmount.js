import { Internals, release } from 'diffhtml';
import { ComponentTreeCache, InstanceCache } from '../../util/caches';
import { releaseHook } from '../hooks';

const hasVTree = (matchTree, vTree) => {
  if (matchTree === vTree) {
    return true;
  }

  vTree.childNodes.forEach(hasVTree.bind(null, matchTree));
};

export default vTree => {
  const { NodeCache } = Internals;
  const root = typeof window !== 'undefined' ? window : global;
  const { customElements } = root;
  const Constructor = customElements && customElements.get(vTree.nodeName);
  const componentTree = ComponentTreeCache.get(vTree);
  const instance = InstanceCache.get(componentTree);

  if (typeof vTree.attributes.ref === 'function') {
    vTree.attributes.ref(null);
  }

  if (instance) {
    [...ComponentTreeCache.keys()].forEach(key => {
      if (NodeCache.has(key) && hasVTree(vTree, key)) {
        release(NodeCache.get(key));
      }
    });
  }

  // Ensure this is a stateful component. Stateless components do not get
  // lifecycle events yet.
  if (instance && instance.componentWillUnmount) {
    instance.componentWillUnmount();
  }

  // Clean up Shadow DOM.
  if (Constructor && NodeCache.has(vTree)) {
    release(NodeCache.get(vTree).shadowRoot);
  }

  // FIXME We release memory based on the DOM Node. This call is failing
  // because when the component renders we are setting a new renderTree to
  // associate
  release(NodeCache.get(vTree));

  ComponentTreeCache.delete(vTree);
  InstanceCache.delete(componentTree);
}
