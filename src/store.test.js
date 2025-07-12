

import { describe, it, expect, vi } from 'vitest'
import ReactiveStore from './store.js'

describe('ReactiveStore', () => {
  describe('Computed Properties', () => {
    it('should support computed properties', () => {
      const store = new ReactiveStore();

      const watchFn = vi.fn()
      store.user.fullName.subscribe(watchFn);
      store.user.firstName = 'Bob';
      store.user.lastName = 'Smith';
      store.user.fullName = () => `${store.user.firstName} ${store.user.lastName}`;

      expect(store.user.firstName+'').toBe('Bob');
      expect(store.user.lastName+'').toBe('Smith');
      expect(store.user.fullName+'').toBe('Bob Smith');
      expect(watchFn).toHaveBeenCalledWith('Bob Smith',['user','fullName']);
    })
  })

  describe('Reactive Properties', () => {

    it('should react to property changes - non-existent', () => {
      const store = new ReactiveStore();

      const watchFn = vi.fn()
      store.user.name.subscribe(watchFn);

      store.user.name = 'Bob';
      expect(store.user.name+'').toBe('Bob');
      expect(watchFn).toHaveBeenCalledWith('Bob',['user','name']);
    })

    it('should react to property changes', () => {
      const store = new ReactiveStore({ user: { name: 'Alice' } });

      const watchFn = vi.fn()
      store.user.name.subscribe(watchFn);

      store.user.name = 'Bob';
      expect(store.user.name+'').toBe('Bob');
      expect(watchFn).toHaveBeenCalledWith('Bob',['user','name']);
    })
    it('should react to property changes on non-existent paths', () => {
      const store = new ReactiveStore();

      const watchFn = vi.fn()
      store.user.name.subscribe(watchFn);

      store.user.name = 'Bob';
      expect(store.user.name+'').toBe('Bob');
      expect(watchFn).toHaveBeenCalledWith('Bob',['user','name']);
    })
    it('should react to nested property changes', () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.subscribe(watchFn)
      store.user.profile.surname = 'Smith'
      expect(watchFn).toHaveBeenCalledWith('Smith',['user', 'profile', 'surname'])
    })

    it('should react to property changes on arrays', () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.subscribe(watchFn);

      store.items[1] = 4;
      expect(store.items+'').toBe([1, 4, 3]+'');
      expect(watchFn).toHaveBeenCalledWith(4, ['items', '1']);
    })

    it('should react to property changes on arrays - push', () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.subscribe(watchFn);

      store.items.push(4);
      expect(store.items+'').toBe([1, 2, 3, 4]+'');
      expect(watchFn).toHaveBeenCalledWith([1, 2, 3, 4], ['items']);
    })
    it('should react to property changes on arrays - pop', () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.subscribe(watchFn);

      store.items.pop();
      expect(store.items+'').toBe([1, 2]+'');
      expect(watchFn).toHaveBeenCalledWith([1, 2], ['items']);
    })
    it('should react to property changes on arrays - shift', () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.subscribe(watchFn);

      store.items.shift();
      expect(store.items+'').toBe([2, 3]+'');
      expect(watchFn).toHaveBeenCalledWith([2, 3], ['items']);
    })
    it('should react to property changes on arrays - unshift', () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.subscribe(watchFn);

      store.items.unshift(4);
      expect(store.items+'').toBe([4, 1, 2, 3]+'');
      expect(watchFn).toHaveBeenCalledWith([4, 1, 2, 3], ['items']);
    })
    it('should react to property changes on arrays - splice', () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.subscribe(watchFn);

      store.items.splice(0, 1, 4);
      expect(store.items+'').toBe([4, 2, 3]+'');
      expect(watchFn).toHaveBeenCalledWith([4, 2, 3], ['items']);
    })
    it('should react to property changes on arrays - sort', () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.subscribe(watchFn);

      store.items.sort((a, b) => b - a);
      expect(store.items+'').toBe([3, 2, 1]+'');
      expect(watchFn).toHaveBeenCalledWith([3, 2, 1], ['items']);
    })
    it('should react to property changes on arrays - reverse', () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.subscribe(watchFn);

      store.items.reverse();
      expect(store.items+'').toBe([3, 2, 1]+'');
      expect(watchFn).toHaveBeenCalledWith([3, 2, 1], ['items']);
    })

  })
})