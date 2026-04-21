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
            let parent = Math.floor((i - 1) / 2);
            if (this.compare(this.data[i], this.data[parent]) >= 0) break;

            [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
            i = parent;
        }
    }

    _heapifyDown() {
        let i = 0;

        while (true) {
            let left = 2 * i + 1;
            let right = 2 * i + 2;
            let smallest = i;

            if (left < this.size() &&
                this.compare(this.data[left], this.data[smallest]) < 0) {
                smallest = left;
            }

            if (right < this.size() &&
                this.compare(this.data[right], this.data[smallest]) < 0) {
                smallest = right;
            }

            if (smallest === i) break;

            [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
            i = smallest;
        }
    }
}

class BiDirectionalPriorityQueue {
    constructor() {
        this.minHeap = new Heap((a, b) => a.priority - b.priority);
        this.maxHeap = new Heap((a, b) => b.priority - a.priority);

        this.head = null;
        this.tail = null;

        this.map = new Map(); 
        this.counter = 0;
    }

    enqueue(item, priority) {
        const node = new Node(item, priority, this.counter++);

        this.map.set(node.id, node);

        
        this.minHeap.push(node);
        this.maxHeap.push(node);


        if (!this.tail) {
            this.head = this.tail = node;
        } else {
            this.tail.next = node;
            node.prev = this.tail;
            this.tail = node;
        }
    }

    _cleanHeap(heap) {
        while (heap.size() > 0) {
            const node = heap.peek();
            if (this.map.has(node.id)) return node;
            heap.pop(); 
        }
        return null;
    }

    _removeNode(node) {
    
        if (node.prev) node.prev.next = node.next;
        else this.head = node.next;

        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev;

    
        this.map.delete(node.id);
    }

    
    peek(type) {
        let node = null;

        switch (type) {
            case "highest":
                node = this._cleanHeap(this.maxHeap);
                break;
            case "lowest":
                node = this._cleanHeap(this.minHeap);
                break;
            case "oldest":
                node = this.head;
                break;
            case "newest":
                node = this.tail;
                break;
            default:
                throw new Error("Invalid type");
        }

        return node ? node.item : null;
    }


    dequeue(type) {
        let node = null;

        switch (type) {
            case "highest":
                node = this._cleanHeap(this.maxHeap);
                if (node) this.maxHeap.pop();
                break;

            case "lowest":
                node = this._cleanHeap(this.minHeap);
                if (node) this.minHeap.pop();
                break;

            case "oldest":
                node = this.head;
                break;

            case "newest":
                node = this.tail;
                break;

            default:
                throw new Error("Invalid type");
        }

        if (!node) return null;

        this._removeNode(node);
        return node.item;
    }

    isEmpty() {
        return this.map.size === 0;
    }
}