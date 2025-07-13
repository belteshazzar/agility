import { describe, it, expect, vi } from 'vitest'
import ReactiveStore from './store.js'

describe('ReactiveStore', () => {
  describe('Computed Properties', () => {
    it('should support computed properties', async () => {
      const store = new ReactiveStore();

      const watchFn = vi.fn()
      store.user.fullName.subscribe(watchFn);
      store.user.firstName = 'Bob';
      store.user.lastName = 'Smith';
      store.user.fullName = () => `${store.user.firstName} ${store.user.lastName}`;

      await Promise.resolve(); // Wait for batched notifications
      expect(store.user.firstName+'').toBe('Bob');
      expect(store.user.lastName+'').toBe('Smith');
      expect(store.user.fullName+'').toBe('Bob Smith');
      expect(watchFn).toHaveBeenCalledWith('Bob Smith',['user','fullName']);
    })
  })

  describe('Reactive Properties', () => {

    it('should react to property changes - non-existent', async () => {
      const store = new ReactiveStore();
      const watchFn = vi.fn();
      store.user.name.subscribe(watchFn);

      store.user.name = 'Bob';

      await Promise.resolve(); // Wait for batched notifications
      expect(store.user.name + '').toBe('Bob');
      expect(watchFn).toHaveBeenCalledWith('Bob', ['user', 'name']);
    });

    it('should react to property changes', async () => {
      const store = new ReactiveStore({ user: { name: 'Alice' } });

      const watchFn = vi.fn()
      store.user.name.subscribe(watchFn);
      store.user.name = 'Bob';

      await Promise.resolve(); // Wait for batched notifications
      expect(store.user.name+'').toBe('Bob');
      expect(watchFn).toHaveBeenCalledWith('Bob',['user','name']);
    })
    it('should react to property changes on non-existent paths', async() => {
      const store = new ReactiveStore();
      const watchFn = vi.fn()
      store.user.name.subscribe(watchFn);
      store.user.name = 'Bob';

      await Promise.resolve(); // Wait for batched notifications
      expect(store.user.name+'').toBe('Bob');
      expect(watchFn).toHaveBeenCalledWith('Bob',['user','name']);
    })
    it('should react to nested property changes', async () => {
      
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

      await Promise.resolve(); // Wait for batched notifications
      expect(watchFn).toHaveBeenCalledWith('Smith',['user', 'profile', 'surname'])
    })

    it('should react to property changes on arrays', async () => {
      const store = new ReactiveStore({
        user: {
          name: 'Alice',
          age: 30
        },
        items: [1, 2, 3]
      })

      const watchFn = vi.fn()
      store.items.subscribe(watchFn);
      store.items[1] = 4;

      await Promise.resolve(); // Wait for batched notifications
      expect(store.items+'').toBe([1, 4, 3]+'');
      expect(watchFn).toHaveBeenCalledWith(4, ['items','1']);
    })

    it('should react to property changes on arrays - push', async () => {
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

      await Promise.resolve(); // Wait for batched notifications
      expect(store.items+'').toBe([1, 2, 3, 4]+'');
      expect(watchFn).toHaveBeenCalledWith([1, 2, 3, 4], ['items']);
    })
    it('should react to property changes on arrays - pop', async () => {
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

      await Promise.resolve(); // Wait for batched notifications
      expect(store.items+'').toBe([1, 2]+'');
      expect(watchFn).toHaveBeenCalledWith([1, 2], ['items']);
    })
    it('should react to property changes on arrays - shift', async () => {
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

      await Promise.resolve(); // Wait for batched notifications
      expect(store.items+'').toBe([2, 3]+'');
      expect(watchFn).toHaveBeenCalledWith([2, 3], ['items']);
    })
    it('should react to property changes on arrays - unshift', async () => {
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

      await Promise.resolve(); // Wait for batched notifications
      expect(store.items+'').toBe([4, 1, 2, 3]+'');
      expect(watchFn).toHaveBeenCalledWith([4, 1, 2, 3], ['items']);
    })
    it('should react to property changes on arrays - splice', async () => {
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

      await Promise.resolve(); // Wait for batched notifications
      expect(store.items+'').toBe([4, 2, 3]+'');
      expect(watchFn).toHaveBeenCalledWith([4, 2, 3], ['items']);
    })
    it('should react to property changes on arrays - sort', async () => {
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

      await Promise.resolve(); // Wait for batched notifications
      expect(store.items+'').toBe([3, 2, 1]+'');
      expect(watchFn).toHaveBeenCalledWith([3, 2, 1], ['items']);
    })
    it('should react to property changes on arrays - reverse', async () => {
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

      await Promise.resolve(); // Wait for batched notifications
      expect(store.items+'').toBe([3, 2, 1]+'');
      expect(watchFn).toHaveBeenCalledWith([3, 2, 1], ['items']);
    })

  })
})