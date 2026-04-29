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