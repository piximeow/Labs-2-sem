const { Node } = require("./Node");
const { Heap } = require("./Heap");

class Node {
  constructor(item, priority, id) {
    this.item = item;
    this.priority = priority;
    this.id = id;
    this.prev = null;
    this.next = null;
  }
}

class Heap {
  constructor(compare) {
    this.data = [];
    this.compare = compare;
  }

  size() {
    return this.data.length;
  }

  peek() {
    return this.data[0] || null;
  }

  push(value) {
    this.data.push(value);
    this._heapifyUp();
  }

  pop() {
    if (this.size() === 0) return null;

    const top = this.data[0];
    const end = this.data.pop();

    if (this.size() > 0) {
      this.data[0] = end;
      this._heapifyDown();
    }

    return top;
  }

  _heapifyUp() {
    let i = this.size() - 1;

    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.compare(this.data[i], this.data[parent]) >= 0) break;

      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }

  _heapifyDown() {
    let i = 0;

    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;

      if (left < this.size() && this.compare(this.data[left], this.data[smallest]) < 0)
        smallest = left;

      if (right < this.size() && this.compare(this.data[right], this.data[smallest]) < 0)
        smallest = right;

      if (smallest === i) break;

      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}