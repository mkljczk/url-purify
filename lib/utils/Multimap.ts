/*
 * ClearURLs
 * Copyright (c) 2017-2022 Kevin Röbert.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Models a multimap backed by a {@link Set}.
 */
class Multimap<K, V> implements Iterable<[K, V]> {
  private _size: number;
  private _map: Map<K, Set<V>>;

  constructor() {
    Object.defineProperty(this, '_map', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0,
    });
    Object.defineProperty(this, '_size', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0,
    });
    this._size = 0;
    this._map = new Map();
  }
  get size() {
    return this._size;
  }
  get(key: K): Set<V> {
    const values = this._map.get(key);
    if (values) {
      return new Set(values);
    }
    return new Set();
  }
  put(key: K, value: V) {
    let values = this._map.get(key);
    if (!values) {
      values = new Set();
    }
    const count = values.size;
    values.add(value);
    if (values.size === count) {
      return false;
    }
    this._map.set(key, values);
    this._size++;
    return true;
  }
  has(key: K) {
    return this._map.has(key);
  }
  hasEntry(key: K, value: V) {
    const values = this._map.get(key);
    if (!values) {
      return false;
    }
    return values.has(value);
  }
  delete(key: K) {
    const values = this._map.get(key);
    if (values && this._map.delete(key)) {
      this._size -= values.size;
      return true;
    }
    return false;
  }
  deleteEntry(key: K, value: V) {
    const values = this._map.get(key);
    if (values) {
      if (!values.delete(value)) {
        return false;
      }
      this._size--;
      return true;
    }
    return false;
  }
  clear() {
    this._map.clear();
    this._size = 0;
  }
  entries() {
    const self = this;
    function* gen(): IterableIterator<[K, V]> {
      for (const [key, values] of self._map.entries()) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }
    return gen();
  }
  values() {
    const self = this;
    function* gen() {
      for (const [, value] of self.entries()) {
        yield value;
      }
    }
    return gen();
  }
  keys() {
    return this._map.keys();
  }
  forEach<T>(
    callback: (this: T | this, key: K, value: V, map: this) => void,
    thisArg?: T,
  ) {
    for (const [key, value] of this.entries()) {
      callback.call(thisArg === undefined ? this : thisArg, key, value, this);
    }
  }
  [Symbol.iterator] = (): IterableIterator<[K, V]> => this.entries();
}

export { Multimap };
